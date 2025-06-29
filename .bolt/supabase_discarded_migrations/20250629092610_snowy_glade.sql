/*
  # CodeOrbit Complete Database Schema

  1. Authentication & User Management
    - user_profiles - Extended user information
    - user_sessions - Session tracking
    - user_security_logs - Security audit trail
    - user_preferences - User settings

  2. Code Analysis System
    - code_submissions - User code submissions
    - code_analyses - AI analysis results
    - problem_solutions - Generated solutions
    - code_execution_results - Execution history
    - flowcharts - Generated flowcharts

  3. AI Assistant & Chat
    - chat_history - AI conversation history
    - ai_models - Available AI models
    - usage_tracking - API usage tracking

  4. Learning & Challenges
    - challenges - Coding challenges
    - user_progress - Learning progress
    - achievements - User achievements
    - learning_paths - Structured learning

  5. Subscription & Billing
    - subscription_plans - Available plans
    - user_subscriptions - User subscription data
    - billing_history - Payment history
    - usage_limits - Feature limits

  6. Content & Media
    - videos - Generated video content
    - file_uploads - User uploaded files
    - exports - Exported content

  7. Security & Compliance
    - audit_logs - System audit trail
    - rate_limits - API rate limiting
    - feature_flags - Feature toggles
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
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

-- User Sessions Table
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

-- User Security Logs Table
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

-- User Preferences Table
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
-- 2. CODE ANALYSIS SYSTEM
-- ============================================================================

-- Code Submissions Table
CREATE TABLE IF NOT EXISTS code_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Code Information
  title text,
  description text,
  code_content text NOT NULL,
  language text NOT NULL,
  
  -- Submission Type
  submission_type text DEFAULT 'analysis' CHECK (submission_type IN ('analysis', 'problem_solving', 'challenge', 'review')),
  problem_statement text,
  
  -- Metadata
  file_name text,
  file_size integer,
  line_count integer,
  character_count integer,
  
  -- Analysis Status
  analysis_status text DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  analysis_started_at timestamptz,
  analysis_completed_at timestamptz,
  
  -- Tags and Categories
  tags text[] DEFAULT '{}',
  category text,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Sharing and Visibility
  is_public boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Code Analyses Table
CREATE TABLE IF NOT EXISTS code_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES code_submissions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Analysis Results
  summary text,
  explanation text,
  score integer CHECK (score >= 0 AND score <= 100),
  
  -- Complexity Analysis
  time_complexity text,
  space_complexity text,
  
  -- Issues and Improvements
  bugs jsonb DEFAULT '[]',
  optimizations jsonb DEFAULT '[]',
  best_practices jsonb DEFAULT '[]',
  security_issues jsonb DEFAULT '[]',
  
  -- Code Quality Metrics
  maintainability_score integer CHECK (maintainability_score >= 0 AND maintainability_score <= 100),
  readability_score integer CHECK (readability_score >= 0 AND readability_score <= 100),
  performance_score integer CHECK (performance_score >= 0 AND performance_score <= 100),
  
  -- AI Model Information
  ai_model text DEFAULT 'gemini-2.0-flash',
  ai_model_version text,
  processing_time_ms integer,
  
  -- Metadata
  analysis_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Problem Solutions Table
CREATE TABLE IF NOT EXISTS problem_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_id uuid REFERENCES code_submissions(id) ON DELETE CASCADE,
  
  -- Problem Information
  problem_title text NOT NULL,
  problem_statement text NOT NULL,
  problem_category text,
  difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  
  -- Solution Information
  language text NOT NULL,
  solution_code text NOT NULL,
  explanation text,
  approach_description text,
  
  -- Complexity Analysis
  time_complexity text,
  space_complexity text,
  
  -- Test Cases
  test_cases jsonb DEFAULT '[]',
  
  -- Optimizations
  optimizations jsonb DEFAULT '[]',
  alternative_solutions jsonb DEFAULT '[]',
  
  -- Learning Resources
  related_concepts text[],
  learning_resources jsonb DEFAULT '[]',
  
  -- Video Generation
  video_script text,
  video_id text,
  video_url text,
  video_status text DEFAULT 'not_generated' CHECK (video_status IN ('not_generated', 'generating', 'completed', 'failed')),
  
  -- AI Model Information
  ai_model text DEFAULT 'gemini-2.0-flash',
  processing_time_ms integer,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Code Execution Results Table
CREATE TABLE IF NOT EXISTS code_execution_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_id uuid REFERENCES code_submissions(id) ON DELETE CASCADE,
  solution_id uuid REFERENCES problem_solutions(id) ON DELETE CASCADE,
  
  -- Execution Information
  language text NOT NULL,
  code_content text NOT NULL,
  
  -- Execution Results
  status text NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  output text,
  error_message text,
  exit_code integer,
  
  -- Performance Metrics
  execution_time_ms integer,
  memory_used_mb decimal,
  cpu_usage_percent decimal,
  
  -- Test Results
  test_results jsonb DEFAULT '[]',
  tests_passed integer DEFAULT 0,
  tests_failed integer DEFAULT 0,
  
  -- Environment Information
  execution_environment text,
  compiler_version text,
  runtime_version text,
  
  created_at timestamptz DEFAULT now()
);

-- Flowcharts Table
CREATE TABLE IF NOT EXISTS flowcharts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_id uuid REFERENCES code_submissions(id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES code_analyses(id) ON DELETE CASCADE,
  solution_id uuid REFERENCES problem_solutions(id) ON DELETE CASCADE,
  
  -- Flowchart Information
  title text,
  description text,
  flowchart_type text DEFAULT 'mermaid' CHECK (flowchart_type IN ('mermaid', 'd2', 'graphviz')),
  
  -- Flowchart Data
  flowchart_code text NOT NULL,
  rendered_svg text,
  rendered_png_url text,
  
  -- Metadata
  node_count integer,
  edge_count integer,
  complexity_level text CHECK (complexity_level IN ('simple', 'moderate', 'complex')),
  
  -- Export Information
  export_formats text[] DEFAULT '{}',
  is_exported boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. AI ASSISTANT & CHAT
-- ============================================================================

-- Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- AI Models Table
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  provider text NOT NULL,
  model_id text NOT NULL,
  description text,
  capabilities text[],
  is_active boolean DEFAULT true,
  cost_per_token decimal,
  max_tokens integer,
  created_at timestamptz DEFAULT now()
);

-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_type text NOT NULL,
  api_endpoint text,
  tokens_used integer,
  cost decimal,
  response_time_ms integer,
  status text CHECK (status IN ('success', 'error', 'timeout')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. LEARNING & CHALLENGES
-- ============================================================================

-- Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  problem_statement text NOT NULL,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category text,
  tags text[],
  
  -- Solution Information
  expected_solution text,
  test_cases jsonb DEFAULT '[]',
  hints jsonb DEFAULT '[]',
  
  -- Metadata
  points integer DEFAULT 0,
  time_limit_minutes integer,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Progress Metrics
  total_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  
  -- Skill Levels
  javascript_level integer DEFAULT 0,
  python_level integer DEFAULT 0,
  java_level integer DEFAULT 0,
  cpp_level integer DEFAULT 0,
  
  -- Learning Path Progress
  current_learning_path text,
  completed_modules text[],
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  category text,
  points integer DEFAULT 0,
  requirements jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Learning Paths Table
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours integer,
  modules jsonb DEFAULT '[]',
  prerequisites text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. SUBSCRIPTION & BILLING
-- ============================================================================

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  price_monthly decimal,
  price_yearly decimal,
  features jsonb DEFAULT '[]',
  limits jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  
  -- Subscription Details
  status text CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  
  -- Billing Information
  stripe_subscription_id text,
  stripe_customer_id text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Billing History Table
CREATE TABLE IF NOT EXISTS billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  
  -- Payment Information
  amount decimal NOT NULL,
  currency text DEFAULT 'USD',
  status text CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  
  -- External References
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  
  -- Metadata
  description text,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now()
);

-- Usage Limits Table
CREATE TABLE IF NOT EXISTS usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  daily_limit integer,
  monthly_limit integer,
  is_unlimited boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 6. CONTENT & MEDIA
-- ============================================================================

-- Videos Table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  solution_id uuid REFERENCES problem_solutions(id) ON DELETE CASCADE,
  
  -- Video Information
  title text,
  description text,
  script text,
  
  -- Video Details
  duration_seconds integer,
  file_size_mb decimal,
  resolution text,
  format text DEFAULT 'mp4',
  
  -- URLs
  video_url text,
  thumbnail_url text,
  download_url text,
  
  -- Generation Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  generation_started_at timestamptz,
  generation_completed_at timestamptz,
  
  -- AI Model Information
  ai_presenter text,
  voice_model text,
  generation_cost decimal,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- File Uploads Table
CREATE TABLE IF NOT EXISTS file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- File Information
  original_name text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  
  -- Upload Details
  upload_type text CHECK (upload_type IN ('avatar', 'code', 'document', 'image')),
  is_public boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- Exports Table
CREATE TABLE IF NOT EXISTS exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Export Information
  export_type text CHECK (export_type IN ('analysis', 'solution', 'flowchart', 'video', 'report')),
  format text CHECK (format IN ('pdf', 'json', 'csv', 'svg', 'png', 'mp4')),
  
  -- Content References
  content_id uuid,
  content_type text,
  
  -- Export Details
  file_path text,
  file_size integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- ============================================================================
-- 7. SECURITY & COMPLIANCE
-- ============================================================================

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Action Information
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  
  -- Request Information
  ip_address inet,
  user_agent text,
  
  -- Changes
  old_values jsonb,
  new_values jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- Rate Limits Table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address inet,
  
  -- Rate Limit Information
  endpoint text NOT NULL,
  requests_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  window_end timestamptz DEFAULT (now() + interval '1 hour'),
  
  created_at timestamptz DEFAULT now()
);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_execution_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE flowcharts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- User Profiles Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- User Sessions Policies
CREATE POLICY "Users can manage own sessions"
  ON user_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- User Security Logs Policies
CREATE POLICY "Users can view own security logs"
  ON user_security_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert security logs"
  ON user_security_logs FOR INSERT
  TO service_role
  USING (true);

-- User Preferences Policies
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Code Submissions Policies
CREATE POLICY "Users can manage own submissions"
  ON code_submissions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public submissions"
  ON code_submissions FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Code Analyses Policies
CREATE POLICY "Users can manage own analyses"
  ON code_analyses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Problem Solutions Policies
CREATE POLICY "Users can manage own solutions"
  ON problem_solutions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Code Execution Results Policies
CREATE POLICY "Users can manage own execution results"
  ON code_execution_results FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Flowcharts Policies
CREATE POLICY "Users can manage own flowcharts"
  ON flowcharts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Chat History Policies
CREATE POLICY "Users can manage their own chat history"
  ON chat_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Usage Tracking Policies
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage"
  ON usage_tracking FOR INSERT
  TO service_role
  USING (true);

-- User Progress Policies
CREATE POLICY "Users can manage own progress"
  ON user_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- User Achievements Policies
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User Subscriptions Policies
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Billing History Policies
CREATE POLICY "Users can view own billing history"
  ON billing_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Videos Policies
CREATE POLICY "Users can manage own videos"
  ON videos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- File Uploads Policies
CREATE POLICY "Users can manage own files"
  ON file_uploads FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Exports Policies
CREATE POLICY "Users can manage own exports"
  ON exports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Audit Logs Policies
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Rate Limits Policies
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  INSERT INTO user_progress (user_id)
  VALUES (NEW.id);
  
  -- Log the registration
  INSERT INTO user_security_logs (user_id, email, event_type, event_description)
  VALUES (NEW.id, NEW.email, 'login_success', 'User account created');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset daily usage counts
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    daily_code_analysis_count = 0,
    daily_problem_solving_count = 0,
    daily_video_generation_count = 0
  WHERE subscription_status = 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id_param uuid,
  feature_type text,
  max_count integer
)
RETURNS boolean AS $$
DECLARE
  current_count integer;
  user_subscription text;
BEGIN
  -- Get user subscription and current count
  SELECT 
    subscription_status,
    CASE 
      WHEN feature_type = 'code_analysis' THEN daily_code_analysis_count
      WHEN feature_type = 'problem_solving' THEN daily_problem_solving_count
      WHEN feature_type = 'video_generation' THEN daily_video_generation_count
      ELSE 0
    END
  INTO user_subscription, current_count
  FROM user_profiles
  WHERE id = user_id_param;
  
  -- Pro users have unlimited access
  IF user_subscription IN ('pro', 'enterprise') THEN
    RETURN true;
  END IF;
  
  -- Check if free user is within limits
  RETURN current_count < max_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment usage count
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

-- Create code submission
CREATE OR REPLACE FUNCTION create_code_submission(
  p_title text,
  p_description text,
  p_code_content text,
  p_language text,
  p_submission_type text DEFAULT 'analysis',
  p_problem_statement text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  submission_id uuid;
  line_count integer;
  char_count integer;
BEGIN
  -- Calculate metrics
  line_count := array_length(string_to_array(p_code_content, E'\n'), 1);
  char_count := length(p_code_content);
  
  -- Insert submission
  INSERT INTO code_submissions (
    user_id, title, description, code_content, language,
    submission_type, problem_statement, line_count, character_count
  ) VALUES (
    auth.uid(), p_title, p_description, p_code_content, p_language,
    p_submission_type, p_problem_statement, line_count, char_count
  ) RETURNING id INTO submission_id;
  
  -- Increment usage count
  PERFORM increment_usage_count(auth.uid(), 'code_analysis');
  
  RETURN submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Save analysis result
CREATE OR REPLACE FUNCTION save_analysis_result(
  p_submission_id uuid,
  p_summary text,
  p_explanation text,
  p_score integer,
  p_time_complexity text,
  p_space_complexity text,
  p_bugs jsonb,
  p_optimizations jsonb,
  p_processing_time_ms integer DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  analysis_id uuid;
BEGIN
  INSERT INTO code_analyses (
    submission_id, user_id, summary, explanation, score,
    time_complexity, space_complexity, bugs, optimizations, processing_time_ms
  ) VALUES (
    p_submission_id, auth.uid(), p_summary, p_explanation, p_score,
    p_time_complexity, p_space_complexity, p_bugs, p_optimizations, p_processing_time_ms
  ) RETURNING id INTO analysis_id;
  
  -- Update submission status
  UPDATE code_submissions 
  SET 
    analysis_status = 'completed',
    analysis_completed_at = now(),
    updated_at = now()
  WHERE id = p_submission_id;
  
  RETURN analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Save problem solution
CREATE OR REPLACE FUNCTION save_problem_solution(
  p_problem_title text,
  p_problem_statement text,
  p_language text,
  p_solution_code text,
  p_explanation text,
  p_time_complexity text,
  p_space_complexity text,
  p_test_cases jsonb DEFAULT '[]',
  p_optimizations jsonb DEFAULT '[]'
)
RETURNS uuid AS $$
DECLARE
  solution_id uuid;
BEGIN
  INSERT INTO problem_solutions (
    user_id, problem_title, problem_statement, language, solution_code,
    explanation, time_complexity, space_complexity, test_cases, optimizations
  ) VALUES (
    auth.uid(), p_problem_title, p_problem_statement, p_language, p_solution_code,
    p_explanation, p_time_complexity, p_space_complexity, p_test_cases, p_optimizations
  ) RETURNING id INTO solution_id;
  
  -- Increment usage count
  PERFORM increment_usage_count(auth.uid(), 'problem_solving');
  
  RETURN solution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Save chat message
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

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- User Sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- User Security Logs
CREATE INDEX IF NOT EXISTS idx_user_security_logs_user_id ON user_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_logs_event_type ON user_security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_user_security_logs_created_at ON user_security_logs(created_at);

-- Code Submissions
CREATE INDEX IF NOT EXISTS idx_code_submissions_user_id ON code_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_submissions_language ON code_submissions(language);
CREATE INDEX IF NOT EXISTS idx_code_submissions_type ON code_submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_code_submissions_status ON code_submissions(analysis_status);
CREATE INDEX IF NOT EXISTS idx_code_submissions_created_at ON code_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_code_submissions_public ON code_submissions(is_public);

-- Code Analyses
CREATE INDEX IF NOT EXISTS idx_code_analyses_submission_id ON code_analyses(submission_id);
CREATE INDEX IF NOT EXISTS idx_code_analyses_user_id ON code_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_code_analyses_score ON code_analyses(score);
CREATE INDEX IF NOT EXISTS idx_code_analyses_created_at ON code_analyses(created_at);

-- Problem Solutions
CREATE INDEX IF NOT EXISTS idx_problem_solutions_user_id ON problem_solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_solutions_language ON problem_solutions(language);
CREATE INDEX IF NOT EXISTS idx_problem_solutions_difficulty ON problem_solutions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_problem_solutions_created_at ON problem_solutions(created_at);

-- Chat History
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- Usage Tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature_type ON usage_tracking(feature_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);

-- User Progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- User Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Videos
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, limits) VALUES
('Free', 'Perfect for getting started', 0, 0, 
 '["3 daily code analyses", "Basic AI assistant", "Community support"]',
 '{"code_analysis": 3, "video_generation": 0, "problem_solving": 3}'),
('Pro', 'For serious developers', 9.99, 99.99,
 '["Unlimited code analysis", "AI video explanations", "Priority support", "Advanced features"]',
 '{"code_analysis": -1, "video_generation": -1, "problem_solving": -1}'),
('Enterprise', 'For teams and organizations', 29.99, 299.99,
 '["Everything in Pro", "Team collaboration", "Admin dashboard", "Custom integrations"]',
 '{"code_analysis": -1, "video_generation": -1, "problem_solving": -1}');

-- Insert default AI models
INSERT INTO ai_models (name, provider, model_id, description, capabilities) VALUES
('Gemini 2.0 Flash', 'Google', 'gemini-2.0-flash', 'Fast and efficient AI model for code analysis', 
 '["code_analysis", "problem_solving", "chat", "explanation"]'),
('GPT-4', 'OpenAI', 'gpt-4', 'Advanced language model for complex reasoning',
 '["code_analysis", "problem_solving", "chat", "explanation"]');

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, points) VALUES
('First Analysis', 'Complete your first code analysis', 'code', 'getting_started', 10),
('Problem Solver', 'Solve your first coding problem', 'lightbulb', 'problem_solving', 15),
('Chat Master', 'Have 10 conversations with the AI assistant', 'message-circle', 'engagement', 20),
('Code Reviewer', 'Analyze 10 different code submissions', 'search', 'analysis', 25),
('Video Creator', 'Generate your first AI video explanation', 'video', 'content', 30);

-- Insert default challenges
INSERT INTO challenges (title, description, problem_statement, difficulty, category, points) VALUES
('Two Sum', 'Find two numbers that add up to target', 
 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
 'easy', 'arrays', 10),
('Reverse Linked List', 'Reverse a singly linked list',
 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
 'medium', 'linked_lists', 20),
('Binary Tree Traversal', 'Implement tree traversal algorithms',
 'Given the root of a binary tree, return the inorder traversal of its nodes values.',
 'medium', 'trees', 25);

-- Insert default learning paths
INSERT INTO learning_paths (title, description, difficulty, estimated_hours, modules) VALUES
('JavaScript Fundamentals', 'Learn the basics of JavaScript programming', 'beginner', 20,
 '[{"title": "Variables and Data Types", "duration": 2}, {"title": "Functions", "duration": 3}, {"title": "Objects and Arrays", "duration": 4}]'),
('Data Structures & Algorithms', 'Master essential data structures and algorithms', 'intermediate', 40,
 '[{"title": "Arrays and Strings", "duration": 5}, {"title": "Linked Lists", "duration": 6}, {"title": "Trees and Graphs", "duration": 8}]');

-- Insert default feature flags
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage) VALUES
('video_generation', 'Enable AI video generation feature', true, 100),
('advanced_analytics', 'Enable advanced analytics dashboard', false, 0),
('team_collaboration', 'Enable team collaboration features', false, 10);