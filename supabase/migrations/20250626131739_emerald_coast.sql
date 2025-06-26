/*
  # CodeSage Subscription & RevenueCat Integration

  1. New Tables
    - `subscription_plans` - Available subscription plans
    - `user_subscriptions` - User subscription records
    - `revenuecat_webhooks` - Webhook event logs
    - `billing_history` - Payment and billing history
    
  2. Security
    - Enable RLS on all tables
    - Webhook authentication
    - Secure subscription management
    
  3. Features
    - RevenueCat integration
    - Subscription lifecycle management
    - Billing history tracking
    - Webhook processing
*/

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan Information
  plan_id text UNIQUE NOT NULL, -- RevenueCat product ID
  name text NOT NULL,
  description text,
  
  -- Pricing
  price_usd decimal NOT NULL,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  currency text DEFAULT 'USD',
  
  -- Features
  features jsonb NOT NULL DEFAULT '[]',
  limits jsonb NOT NULL DEFAULT '{}', -- e.g., {"video_generations": -1, "code_analyses": -1}
  
  -- Plan Status
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  
  -- Metadata
  revenuecat_product_id text,
  apple_product_id text,
  google_product_id text,
  stripe_price_id text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Subscription Information
  revenuecat_user_id text NOT NULL,
  revenuecat_subscription_id text,
  plan_id text REFERENCES subscription_plans(plan_id) NOT NULL,
  
  -- Subscription Status
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'in_trial', 'paused', 'pending')),
  
  -- Dates
  started_at timestamptz NOT NULL,
  expires_at timestamptz,
  cancelled_at timestamptz,
  trial_ends_at timestamptz,
  
  -- Billing Information
  current_period_start timestamptz,
  current_period_end timestamptz,
  auto_renew boolean DEFAULT true,
  
  -- Platform Information
  platform text CHECK (platform IN ('ios', 'android', 'web', 'stripe')),
  store text CHECK (store IN ('app_store', 'play_store', 'stripe', 'promotional')),
  
  -- Pricing
  price_usd decimal,
  currency text DEFAULT 'USD',
  
  -- RevenueCat Data
  revenuecat_data jsonb DEFAULT '{}',
  
  -- Metadata
  is_sandbox boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, revenuecat_subscription_id)
);

-- RevenueCat Webhooks Table
CREATE TABLE IF NOT EXISTS revenuecat_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Webhook Information
  event_type text NOT NULL,
  event_id text UNIQUE,
  
  -- User Information
  revenuecat_user_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Subscription Information
  revenuecat_subscription_id text,
  product_id text,
  
  -- Event Data
  event_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  processing_error text,
  
  -- Metadata
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Billing History Table
CREATE TABLE IF NOT EXISTS billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  
  -- Transaction Information
  transaction_id text UNIQUE NOT NULL,
  revenuecat_transaction_id text,
  
  -- Transaction Details
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'renewal', 'refund', 'cancellation')),
  amount_usd decimal NOT NULL,
  currency text DEFAULT 'USD',
  
  -- Product Information
  product_id text NOT NULL,
  plan_name text,
  
  -- Dates
  transaction_date timestamptz NOT NULL,
  period_start timestamptz,
  period_end timestamptz,
  
  -- Status
  status text NOT NULL CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  
  -- Platform Information
  platform text,
  store text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenuecat_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON user_subscriptions FOR ALL
  TO service_role;

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for revenuecat_webhooks
CREATE POLICY "Only service role can manage webhooks"
  ON revenuecat_webhooks FOR ALL
  TO service_role;

-- RLS Policies for billing_history
CREATE POLICY "Users can view own billing history"
  ON billing_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all billing history"
  ON billing_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Functions for subscription management
CREATE OR REPLACE FUNCTION process_revenuecat_webhook(
  p_event_type text,
  p_event_id text,
  p_event_data jsonb
)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_revenuecat_user_id text;
  v_subscription_data jsonb;
  v_product_id text;
  v_expires_date timestamptz;
  v_subscription_id uuid;
BEGIN
  -- Extract user information
  v_revenuecat_user_id := p_event_data->>'app_user_id';
  v_subscription_data := p_event_data->'subscriber';
  
  -- Find user by RevenueCat user ID
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE revenuecat_user_id = v_revenuecat_user_id;
  
  -- If user not found, try to find by email
  IF v_user_id IS NULL THEN
    SELECT up.id INTO v_user_id
    FROM user_profiles up
    JOIN auth.users au ON up.id = au.id
    WHERE au.email = (v_subscription_data->>'original_app_user_id');
  END IF;
  
  -- Log webhook
  INSERT INTO revenuecat_webhooks (
    event_type, event_id, revenuecat_user_id, user_id, event_data
  ) VALUES (
    p_event_type, p_event_id, v_revenuecat_user_id, v_user_id, p_event_data
  );
  
  -- Process different event types
  CASE p_event_type
    WHEN 'INITIAL_PURCHASE', 'RENEWAL' THEN
      PERFORM handle_subscription_activation(v_user_id, v_revenuecat_user_id, p_event_data);
    
    WHEN 'CANCELLATION' THEN
      PERFORM handle_subscription_cancellation(v_user_id, p_event_data);
    
    WHEN 'EXPIRATION' THEN
      PERFORM handle_subscription_expiration(v_user_id, p_event_data);
    
    WHEN 'BILLING_ISSUE' THEN
      PERFORM handle_billing_issue(v_user_id, p_event_data);
    
    ELSE
      -- Log unknown event type
      UPDATE revenuecat_webhooks
      SET processing_error = 'Unknown event type: ' || p_event_type
      WHERE event_id = p_event_id;
  END CASE;
  
  -- Mark webhook as processed
  UPDATE revenuecat_webhooks
  SET processed = true, processed_at = now()
  WHERE event_id = p_event_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error
  UPDATE revenuecat_webhooks
  SET processing_error = SQLERRM
  WHERE event_id = p_event_id;
  
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle subscription activation
CREATE OR REPLACE FUNCTION handle_subscription_activation(
  p_user_id uuid,
  p_revenuecat_user_id text,
  p_event_data jsonb
)
RETURNS void AS $$
DECLARE
  v_subscription_data jsonb;
  v_product_id text;
  v_expires_date timestamptz;
  v_subscription_id text;
  v_plan_id text;
BEGIN
  v_subscription_data := p_event_data->'subscriber';
  v_product_id := p_event_data->>'product_id';
  v_expires_date := (p_event_data->>'expiration_date')::timestamptz;
  v_subscription_id := p_event_data->>'subscription_id';
  
  -- Get plan ID from product ID
  SELECT plan_id INTO v_plan_id
  FROM subscription_plans
  WHERE revenuecat_product_id = v_product_id;
  
  -- Update or insert subscription
  INSERT INTO user_subscriptions (
    user_id, revenuecat_user_id, revenuecat_subscription_id, plan_id,
    status, started_at, expires_at, revenuecat_data
  ) VALUES (
    p_user_id, p_revenuecat_user_id, v_subscription_id, v_plan_id,
    'active', now(), v_expires_date, v_subscription_data
  )
  ON CONFLICT (user_id, revenuecat_subscription_id) 
  DO UPDATE SET
    status = 'active',
    expires_at = v_expires_date,
    revenuecat_data = v_subscription_data,
    updated_at = now();
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    role = 'pro_user',
    subscription_status = 'active',
    subscription_plan = v_plan_id,
    subscription_expires_at = v_expires_date,
    revenuecat_user_id = p_revenuecat_user_id,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Create billing history record
  INSERT INTO billing_history (
    user_id, transaction_id, revenuecat_transaction_id,
    transaction_type, amount_usd, product_id, plan_name,
    transaction_date, status
  ) VALUES (
    p_user_id, 
    p_event_data->>'transaction_id',
    p_event_data->>'revenuecat_transaction_id',
    'purchase',
    (p_event_data->>'price')::decimal,
    v_product_id,
    (SELECT name FROM subscription_plans WHERE plan_id = v_plan_id),
    now(),
    'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle subscription cancellation
CREATE OR REPLACE FUNCTION handle_subscription_cancellation(
  p_user_id uuid,
  p_event_data jsonb
)
RETURNS void AS $$
DECLARE
  v_subscription_id text;
BEGIN
  v_subscription_id := p_event_data->>'subscription_id';
  
  -- Update subscription status
  UPDATE user_subscriptions
  SET 
    status = 'cancelled',
    cancelled_at = now(),
    auto_renew = false,
    updated_at = now()
  WHERE user_id = p_user_id AND revenuecat_subscription_id = v_subscription_id;
  
  -- Update user profile (keep pro access until expiration)
  UPDATE user_profiles
  SET 
    subscription_status = 'cancelled',
    updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle subscription expiration
CREATE OR REPLACE FUNCTION handle_subscription_expiration(
  p_user_id uuid,
  p_event_data jsonb
)
RETURNS void AS $$
DECLARE
  v_subscription_id text;
BEGIN
  v_subscription_id := p_event_data->>'subscription_id';
  
  -- Update subscription status
  UPDATE user_subscriptions
  SET 
    status = 'expired',
    updated_at = now()
  WHERE user_id = p_user_id AND revenuecat_subscription_id = v_subscription_id;
  
  -- Downgrade user to free
  UPDATE user_profiles
  SET 
    role = 'free_user',
    subscription_status = 'inactive',
    subscription_plan = NULL,
    subscription_expires_at = NULL,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle billing issues
CREATE OR REPLACE FUNCTION handle_billing_issue(
  p_user_id uuid,
  p_event_data jsonb
)
RETURNS void AS $$
DECLARE
  v_subscription_id text;
BEGIN
  v_subscription_id := p_event_data->>'subscription_id';
  
  -- Update subscription status
  UPDATE user_subscriptions
  SET 
    status = 'pending',
    updated_at = now()
  WHERE user_id = p_user_id AND revenuecat_subscription_id = v_subscription_id;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    subscription_status = 'past_due',
    updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_status(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_subscription user_subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id 
  AND status IN ('active', 'in_trial')
  AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_subscription.id IS NULL THEN
    RETURN jsonb_build_object(
      'is_active', false,
      'plan', null,
      'status', 'inactive'
    );
  END IF;
  
  -- Get plan details
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE plan_id = v_subscription.plan_id;
  
  RETURN jsonb_build_object(
    'is_active', true,
    'status', v_subscription.status,
    'plan', jsonb_build_object(
      'id', v_plan.plan_id,
      'name', v_plan.name,
      'features', v_plan.features,
      'limits', v_plan.limits
    ),
    'expires_at', v_subscription.expires_at,
    'auto_renew', v_subscription.auto_renew
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_id, name, description, price_usd, billing_cycle, features, limits) VALUES
('pro_monthly', 'Pro Monthly', 'Full access to all CodeSage features', 9.99, 'monthly', 
 '["Unlimited code analysis", "AI video explanations", "Voice narration", "Flowchart generation", "Export capabilities", "Priority support"]',
 '{"code_analyses": -1, "video_generations": -1, "problem_solving": -1, "flowchart_exports": -1}'),
 
('pro_yearly', 'Pro Yearly', 'Full access with 17% savings', 99.00, 'yearly',
 '["Everything in Pro Monthly", "Custom AI avatars", "Advanced analytics", "Team collaboration", "API access", "White-label solutions"]',
 '{"code_analyses": -1, "video_generations": -1, "problem_solving": -1, "flowchart_exports": -1, "custom_avatars": true}'),
 
('student', 'Student Plan', 'Special pricing for students', 29.00, 'monthly',
 '["All Pro features", "Student verification", "Study group tools", "Academic templates", "Career guidance"]',
 '{"code_analyses": -1, "video_generations": -1, "problem_solving": -1, "flowchart_exports": -1}');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_id ON subscription_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_revenuecat_user_id ON user_subscriptions(revenuecat_user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

CREATE INDEX IF NOT EXISTS idx_revenuecat_webhooks_event_id ON revenuecat_webhooks(event_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_webhooks_event_type ON revenuecat_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_revenuecat_webhooks_processed ON revenuecat_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_revenuecat_webhooks_user_id ON revenuecat_webhooks(user_id);

CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_transaction_id ON billing_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_transaction_date ON billing_history(transaction_date);
CREATE INDEX IF NOT EXISTS idx_billing_history_status ON billing_history(status);