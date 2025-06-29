/*
  # CodeOrbit Database Schema

  1. Authentication & User Management
    - user_profiles - Extended user information
    - user_sessions - Session tracking
    - user_security_logs - Security audit trail
    - user_preferences - User settings

  2. Code Analysis System
    - chat_history - AI conversation history
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USER PROFILES
-- ============================================================================

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  username text UNIQUE,
  bio text,
  website text,
  location text,
  timezone text DEFAULT 'UTC',
  
  -- Role & Permissions
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_admin boolean DEFAULT false,
  permissions jsonb DEFAULT '{}',
  
  -- Subscription & Billing
  subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'enterprise', 'cancelled')),
  subscription_plan text,
  subscription_expires_at timestamptz,
  trial_ends_at timestamptz,
  billing_customer_id text,
  
  -- Usage Tracking
  daily_code_analysis_count integer DEFAULT 0,
  daily_problem_solving_count integer DEFAULT 0,
  daily_video_generation_count integer DEFAULT 0,
  total_analyses integer DEFAULT 0,
  total_problems_solved integer DEFAULT 0,
  total_videos_generated integer DEFAULT 0,
  
  -- Preferences
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  preferred_language text DEFAULT 'javascript',
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  
  -- Metadata
  onboarding_completed boolean DEFAULT false,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- USER SESSIONS
-- ============================================================================

-- Create user_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  refresh_token text,
  
  -- Device Information
  device_id text,
  device_name text,
  device_type text CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser text,
  os text,
  ip_address inet,
  user_agent text,
  
  -- Location
  country text,
  city text,
  
  -- Session Management
  is_active boolean DEFAULT true,
  last_accessed_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- USER SECURITY LOGS
-- ============================================================================

-- Create user_security_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  
  -- Event Information
  event_type text NOT NULL CHECK (event_type IN (
    'login_success', 'login_failed', 'logout', 'password_reset_requested',
    'password_reset_completed', 'email_verified', 'account_locked',
    'suspicious_activity', 'session_expired', 'device_added', 'admin_action'
  )),
  event_description text,
  
  -- Request Information
  ip_address inet,
  user_agent text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Code Analysis Preferences
  default_language text DEFAULT 'javascript',
  analysis_depth text DEFAULT 'standard' CHECK (analysis_depth IN ('quick', 'standard', 'detailed')),
  auto_save_code boolean DEFAULT true,
  
  -- Video Generation Preferences
  preferred_ai_presenter text,
  video_quality text DEFAULT 'high' CHECK (video_quality IN ('low', 'medium', 'high', 'ultra')),
  video_resolution text DEFAULT '1080p' CHECK (video_resolution IN ('720p', '1080p', '4k')),
  speaking_style text DEFAULT 'educational' CHECK (speaking_style IN ('casual', 'professional', 'educational', 'enthusiastic')),
  
  -- Notification Preferences
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  challenge_reminders boolean DEFAULT true,
  achievement_alerts boolean DEFAULT true,
  weekly_reports boolean DEFAULT true,
  marketing_updates boolean DEFAULT false,
  
  -- Privacy Settings
  profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends')),
  show_progress boolean DEFAULT true,
  show_achievements boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CHAT HISTORY
-- ============================================================================

-- Create chat_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view own security logs" ON user_security_logs;
DROP POLICY IF EXISTS "Admins can view all security logs" ON user_security_logs;
DROP POLICY IF EXISTS "Users can insert their own security logs" ON user_security_logs;
DROP POLICY IF EXISTS "Service role can insert security logs" ON user_security_logs;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage their own chat history" ON chat_history;

-- User Profiles Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- User Sessions Policies
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Security Logs Policies
CREATE POLICY "Users can view own security logs"
  ON user_security_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security logs"
  ON user_security_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Users can insert their own security logs"
  ON user_security_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert security logs"
  ON user_security_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- User Preferences Policies
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chat History Policies
CREATE POLICY "Users can manage their own chat history"
  ON chat_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  -- Log the registration
  INSERT INTO user_security_logs (user_id, email, event_type, event_description)
  VALUES (NEW.id, NEW.email, 'login_success', 'User account created');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(
  user_id_param uuid,
  feature_type text
)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    daily_code_analysis_count = CASE 
      WHEN feature_type = 'code_analysis' THEN daily_code_analysis_count + 1
      ELSE daily_code_analysis_count
    END,
    daily_problem_solving_count = CASE 
      WHEN feature_type = 'problem_solving' THEN daily_problem_solving_count + 1
      ELSE daily_problem_solving_count
    END,
    daily_video_generation_count = CASE 
      WHEN feature_type = 'video_generation' THEN daily_video_generation_count + 1
      ELSE daily_video_generation_count
    END,
    total_analyses = CASE 
      WHEN feature_type = 'code_analysis' THEN total_analyses + 1
      ELSE total_analyses
    END,
    total_problems_solved = CASE 
      WHEN feature_type = 'problem_solving' THEN total_problems_solved + 1
      ELSE total_problems_solved
    END,
    total_videos_generated = CASE 
      WHEN feature_type = 'video_generation' THEN total_videos_generated + 1
      ELSE total_videos_generated
    END,
    updated_at = now()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save chat message
CREATE OR REPLACE FUNCTION save_chat_message(
  p_role text,
  p_content text
)
RETURNS uuid AS $$
DECLARE
  message_id uuid;
BEGIN
  INSERT INTO chat_history (
    user_id, role, content
  ) VALUES (
    auth.uid(), p_role, p_content
  ) RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create trigger for updated_at on user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create trigger for updated_at on user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_security_logs_user_id ON user_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_logs_event_type ON user_security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_user_security_logs_created_at ON user_security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);