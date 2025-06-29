/*
  # Complete CodeOrbit Database Schema

  1. Authentication & User Management
    - user_profiles: Extended user information
    - user_sessions: Session tracking
    - user_security_logs: Security audit trail
    - user_preferences: User settings

  2. Code Analysis System
    - code_submissions: User code submissions
    - code_analyses: AI analysis results
    - problem_solutions: Generated solutions
    - code_execution_results: Execution history

  3. AI Assistant & Chat
    - chat_history: AI conversations
    - ai_models: Available AI models
    - usage_tracking: API usage tracking

  4. Learning & Challenges
    - challenges: Coding challenges
    - user_progress: Learning progress
    - achievements: Achievement system
    - user_achievements: User-specific achievements
    - learning_paths: Structured learning paths

  5. Subscription & Billing
    - subscription_plans: Available plans
    - user_subscriptions: User subscription data
    - billing_history: Payment history
    - usage_limits: Feature usage limits

  6. Content & Media
    - videos: Generated video content
    - file_uploads: User uploaded files
    - exports: Exported content

  7. Security & Compliance
    - audit_logs: System audit trail
    - rate_limits: API rate limiting
    - feature_flags: Feature toggles
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  website TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_admin BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'enterprise', 'cancelled')),
  subscription_plan TEXT,
  subscription_expires_at TIMESTAMPTZ,
  daily_code_analysis_count INTEGER DEFAULT 0,
  daily_problem_solving_count INTEGER DEFAULT 0,
  daily_video_generation_count INTEGER DEFAULT 0,
  total_analyses INTEGER DEFAULT 0,
  total_problems_solved INTEGER DEFAULT 0,
  total_videos_generated INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  preferred_language TEXT DEFAULT 'javascript',
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User security logs table
CREATE TABLE IF NOT EXISTS user_security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  event_type TEXT NOT NULL,
  event_description TEXT,
  ip_address INET,
  user_agent TEXT,
  location TEXT,
  success BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_language TEXT DEFAULT 'javascript',
  code_theme TEXT DEFAULT 'dark',
  font_size INTEGER DEFAULT 14,
  auto_save BOOLEAN DEFAULT TRUE,
  show_line_numbers BOOLEAN DEFAULT TRUE,
  word_wrap BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  marketing_updates BOOLEAN DEFAULT FALSE,
  privacy_level TEXT DEFAULT 'private' CHECK (privacy_level IN ('public', 'private', 'friends')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CODE ANALYSIS SYSTEM
-- ============================================================================

-- Code submissions table
CREATE TABLE IF NOT EXISTS code_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  code_content TEXT NOT NULL,
  language TEXT NOT NULL,
  submission_type TEXT DEFAULT 'analysis' CHECK (submission_type IN ('analysis', 'problem_solving', 'challenge', 'review')),
  problem_statement TEXT,
  file_name TEXT,
  file_size INTEGER,
  line_count INTEGER,
  character_count INTEGER,
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  analysis_started_at TIMESTAMPTZ,
  analysis_completed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_public BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Code analyses table
CREATE TABLE IF NOT EXISTS code_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES code_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary TEXT,
  explanation TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  time_complexity TEXT,
  space_complexity TEXT,
  bugs JSONB DEFAULT '[]',
  optimizations JSONB DEFAULT '[]',
  best_practices JSONB DEFAULT '[]',
  security_issues JSONB DEFAULT '[]',
  maintainability_score INTEGER CHECK (maintainability_score >= 0 AND maintainability_score <= 100),
  readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  ai_model TEXT DEFAULT 'gemini-2.0-flash',
  ai_model_version TEXT,
  processing_time_ms INTEGER,
  analysis_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problem solutions table
CREATE TABLE IF NOT EXISTS problem_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES code_submissions(id) ON DELETE SET NULL,
  problem_title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  problem_category TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  language TEXT NOT NULL,
  solution_code TEXT NOT NULL,
  explanation TEXT,
  approach_description TEXT,
  time_complexity TEXT,
  space_complexity TEXT,
  test_cases JSONB DEFAULT '[]',
  optimizations JSONB DEFAULT '[]',
  alternative_solutions JSONB DEFAULT '[]',
  related_concepts TEXT[] DEFAULT '{}',
  learning_resources JSONB DEFAULT '[]',
  video_script TEXT,
  video_id TEXT,
  video_url TEXT,
  video_status TEXT DEFAULT 'not_generated' CHECK (video_status IN ('not_generated', 'generating', 'completed', 'failed')),
  ai_model TEXT DEFAULT 'gemini-2.0-flash',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Code execution results table
CREATE TABLE IF NOT EXISTS code_execution_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES code_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  execution_id TEXT NOT NULL,
  language TEXT NOT NULL,
  code_content TEXT NOT NULL,
  input_data TEXT,
  output_data TEXT,
  error_message TEXT,
  execution_time_ms INTEGER,
  memory_used_mb DECIMAL(10,2),
  exit_code INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout', 'memory_limit')),
  compiler_version TEXT,
  runtime_version TEXT,
  execution_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flowcharts table
CREATE TABLE IF NOT EXISTS flowcharts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES code_submissions(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES problem_solutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  flowchart_type TEXT DEFAULT 'mermaid' CHECK (flowchart_type IN ('mermaid', 'd2', 'plantuml')),
  flowchart_content TEXT NOT NULL,
  rendered_svg TEXT,
  rendered_png_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. AI ASSISTANT & CHAT
-- ============================================================================

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI models table
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  description TEXT,
  capabilities TEXT[] DEFAULT '{}',
  max_tokens INTEGER,
  cost_per_token DECIMAL(10,8),
  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  api_endpoint TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. LEARNING & CHALLENGES
-- ============================================================================

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  points INTEGER DEFAULT 0,
  time_limit_minutes INTEGER,
  memory_limit_mb INTEGER,
  test_cases JSONB NOT NULL DEFAULT '[]',
  starter_code JSONB DEFAULT '{}',
  solution_code JSONB DEFAULT '{}',
  hints JSONB DEFAULT '[]',
  learning_objectives TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  attempts INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  completion_time_ms INTEGER,
  solution_code TEXT,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirements JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_id)
);

-- Learning paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours INTEGER,
  prerequisites TEXT[] DEFAULT '{}',
  learning_objectives TEXT[] DEFAULT '{}',
  modules JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. SUBSCRIPTION & BILLING
-- ============================================================================

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing history table
CREATE TABLE IF NOT EXISTS billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  description TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage limits table
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  daily_limit INTEGER,
  monthly_limit INTEGER,
  is_unlimited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, feature_name)
);

-- ============================================================================
-- 6. CONTENT & MEDIA
-- ============================================================================

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES problem_solutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  script TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_mb DECIMAL(10,2),
  resolution TEXT,
  format TEXT DEFAULT 'mp4',
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  tavus_video_id TEXT,
  ai_presenter TEXT,
  voice_settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('avatar', 'code', 'document', 'image', 'video')),
  is_public BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exports table
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('analysis', 'solution', 'flowchart', 'video', 'progress')),
  content_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  format TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. SECURITY & COMPLIANCE
-- ============================================================================

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  endpoint TEXT NOT NULL,
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users UUID[] DEFAULT '{}',
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);

-- Code submissions indexes
CREATE INDEX IF NOT EXISTS idx_code_submissions_user_id ON code_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_submissions_language ON code_submissions(language);
CREATE INDEX IF NOT EXISTS idx_code_submissions_created_at ON code_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_code_submissions_is_public ON code_submissions(is_public);

-- Code analyses indexes
CREATE INDEX IF NOT EXISTS idx_code_analyses_submission_id ON code_analyses(submission_id);
CREATE INDEX IF NOT EXISTS idx_code_analyses_user_id ON code_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_code_analyses_score ON code_analyses(score);

-- Chat history indexes
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature_type ON usage_tracking(feature_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
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

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- User sessions policies
CREATE POLICY "Users can manage their own sessions" ON user_sessions FOR ALL USING (auth.uid() = user_id);

-- User security logs policies
CREATE POLICY "Users can view own security logs" ON user_security_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert security logs" ON user_security_logs FOR INSERT WITH CHECK (true);

-- User preferences policies
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Code submissions policies
CREATE POLICY "Users can manage their own submissions" ON code_submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public submissions" ON code_submissions FOR SELECT USING (is_public = true);

-- Code analyses policies
CREATE POLICY "Users can manage their own analyses" ON code_analyses FOR ALL USING (auth.uid() = user_id);

-- Problem solutions policies
CREATE POLICY "Users can manage their own solutions" ON problem_solutions FOR ALL USING (auth.uid() = user_id);

-- Code execution results policies
CREATE POLICY "Users can manage their own execution results" ON code_execution_results FOR ALL USING (auth.uid() = user_id);

-- Flowcharts policies
CREATE POLICY "Users can manage their own flowcharts" ON flowcharts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public flowcharts" ON flowcharts FOR SELECT USING (is_public = true);

-- Chat history policies
CREATE POLICY "Users can manage their own chat history" ON chat_history FOR ALL USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage tracking" ON usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert usage tracking" ON usage_tracking FOR INSERT WITH CHECK (true);

-- User progress policies
CREATE POLICY "Users can manage their own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);

-- User subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage subscriptions" ON user_subscriptions FOR ALL USING (true);

-- Billing history policies
CREATE POLICY "Users can view own billing history" ON billing_history FOR SELECT USING (auth.uid() = user_id);

-- Videos policies
CREATE POLICY "Users can manage their own videos" ON videos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public videos" ON videos FOR SELECT USING (is_public = true);

-- File uploads policies
CREATE POLICY "Users can manage their own files" ON file_uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public files" ON file_uploads FOR SELECT USING (is_public = true);

-- Exports policies
CREATE POLICY "Users can manage their own exports" ON exports FOR ALL USING (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Rate limits policies
CREATE POLICY "Users can view own rate limits" ON rate_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage rate limits" ON rate_limits FOR ALL USING (true);

-- Public tables (no RLS needed)
-- ai_models, challenges, achievements, learning_paths, subscription_plans, usage_limits, feature_flags

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  -- Log the signup
  INSERT INTO user_security_logs (user_id, email, event_type, event_description)
  VALUES (NEW.id, NEW.email, 'signup', 'User account created');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_feature_type TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  user_subscription TEXT;
BEGIN
  -- Get user subscription status
  SELECT subscription_status INTO user_subscription
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- Pro users have unlimited access
  IF user_subscription IN ('pro', 'enterprise') THEN
    RETURN TRUE;
  END IF;
  
  -- Check current usage for free users
  SELECT COUNT(*) INTO current_count
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND created_at >= CURRENT_DATE;
  
  RETURN current_count < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, feature_type)
  VALUES (p_user_id, p_feature_type);
  
  -- Update daily counters in user_profiles
  UPDATE user_profiles
  SET 
    daily_code_analysis_count = CASE WHEN p_feature_type = 'code_analysis' THEN daily_code_analysis_count + 1 ELSE daily_code_analysis_count END,
    daily_problem_solving_count = CASE WHEN p_feature_type = 'problem_solving' THEN daily_problem_solving_count + 1 ELSE daily_problem_solving_count END,
    daily_video_generation_count = CASE WHEN p_feature_type = 'video_generation' THEN daily_video_generation_count + 1 ELSE daily_video_generation_count END,
    total_analyses = CASE WHEN p_feature_type = 'code_analysis' THEN total_analyses + 1 ELSE total_analyses END,
    total_problems_solved = CASE WHEN p_feature_type = 'problem_solving' THEN total_problems_solved + 1 ELSE total_problems_solved END,
    total_videos_generated = CASE WHEN p_feature_type = 'video_generation' THEN total_videos_generated + 1 ELSE total_videos_generated END,
    last_active_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create code submission
CREATE OR REPLACE FUNCTION create_code_submission(
  p_title TEXT,
  p_description TEXT,
  p_code_content TEXT,
  p_language TEXT,
  p_submission_type TEXT DEFAULT 'analysis',
  p_problem_statement TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  submission_id UUID;
  line_count INTEGER;
  char_count INTEGER;
BEGIN
  -- Calculate metrics
  line_count := array_length(string_to_array(p_code_content, E'\n'), 1);
  char_count := length(p_code_content);
  
  INSERT INTO code_submissions (
    user_id,
    title,
    description,
    code_content,
    language,
    submission_type,
    problem_statement,
    line_count,
    character_count
  ) VALUES (
    auth.uid(),
    p_title,
    p_description,
    p_code_content,
    p_language,
    p_submission_type,
    p_problem_statement,
    line_count,
    char_count
  ) RETURNING id INTO submission_id;
  
  RETURN submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save analysis result
CREATE OR REPLACE FUNCTION save_analysis_result(
  p_submission_id UUID,
  p_summary TEXT,
  p_explanation TEXT,
  p_score INTEGER,
  p_time_complexity TEXT,
  p_space_complexity TEXT,
  p_bugs JSONB,
  p_optimizations JSONB,
  p_processing_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  analysis_id UUID;
BEGIN
  INSERT INTO code_analyses (
    submission_id,
    user_id,
    summary,
    explanation,
    score,
    time_complexity,
    space_complexity,
    bugs,
    optimizations,
    processing_time_ms
  ) VALUES (
    p_submission_id,
    auth.uid(),
    p_summary,
    p_explanation,
    p_score,
    p_time_complexity,
    p_space_complexity,
    p_bugs,
    p_optimizations,
    p_processing_time_ms
  ) RETURNING id INTO analysis_id;
  
  -- Update submission status
  UPDATE code_submissions
  SET 
    analysis_status = 'completed',
    analysis_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;
  
  RETURN analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save problem solution
CREATE OR REPLACE FUNCTION save_problem_solution(
  p_problem_title TEXT,
  p_problem_statement TEXT,
  p_language TEXT,
  p_solution_code TEXT,
  p_explanation TEXT,
  p_time_complexity TEXT,
  p_space_complexity TEXT,
  p_test_cases JSONB DEFAULT '[]',
  p_optimizations JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
  solution_id UUID;
BEGIN
  INSERT INTO problem_solutions (
    user_id,
    problem_title,
    problem_statement,
    language,
    solution_code,
    explanation,
    time_complexity,
    space_complexity,
    test_cases,
    optimizations
  ) VALUES (
    auth.uid(),
    p_problem_title,
    p_problem_statement,
    p_language,
    p_solution_code,
    p_explanation,
    p_time_complexity,
    p_space_complexity,
    p_test_cases,
    p_optimizations
  ) RETURNING id INTO solution_id;
  
  RETURN solution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save chat message
CREATE OR REPLACE FUNCTION save_chat_message(
  p_role TEXT,
  p_content TEXT
)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
BEGIN
  INSERT INTO chat_history (user_id, role, content)
  VALUES (auth.uid(), p_role, p_content)
  RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_code_submissions_updated_at ON code_submissions;
CREATE TRIGGER update_code_submissions_updated_at
  BEFORE UPDATE ON code_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, limits, is_active, is_popular) VALUES
('Free', 'Perfect for getting started', 0.00, 0.00, 
 '["3 code analyses per day", "Basic AI assistant", "Public code sharing", "Community support"]',
 '{"code_analysis": 3, "video_generation": 0, "problem_solving": 3}',
 true, false),
('Pro', 'For serious developers', 9.99, 99.99,
 '["Unlimited code analysis", "AI video explanations", "Priority AI processing", "Advanced flowcharts", "Export capabilities", "Premium challenges", "Priority support"]',
 '{"code_analysis": -1, "video_generation": -1, "problem_solving": -1}',
 true, true),
('Enterprise', 'For teams and organizations', 29.99, 299.99,
 '["Everything in Pro", "Team collaboration", "Admin dashboard", "Custom integrations", "Dedicated support", "SLA guarantee"]',
 '{"code_analysis": -1, "video_generation": -1, "problem_solving": -1}',
 true, false)
ON CONFLICT (name) DO NOTHING;

-- Insert AI models
INSERT INTO ai_models (name, provider, model_id, description, capabilities, max_tokens, is_active) VALUES
('Gemini 2.0 Flash', 'Google', 'gemini-2.0-flash', 'Latest Gemini model for code analysis', '["code_analysis", "problem_solving", "chat", "explanation"]', 1000000, true),
('GPT-4', 'OpenAI', 'gpt-4', 'Advanced language model', '["code_analysis", "chat", "explanation"]', 8192, false),
('Claude 3', 'Anthropic', 'claude-3-sonnet', 'Helpful AI assistant', '["chat", "explanation", "code_review"]', 200000, false)
ON CONFLICT (name) DO NOTHING;

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, category, points, rarity, requirements) VALUES
('First Analysis', 'Complete your first code analysis', 'code', 'analysis', 10, 'common', '{"analyses_count": 1}'),
('Problem Solver', 'Solve your first coding problem', 'lightbulb', 'problem_solving', 15, 'common', '{"problems_solved": 1}'),
('Code Master', 'Achieve a perfect score on code analysis', 'trophy', 'analysis', 50, 'rare', '{"perfect_scores": 1}'),
('Streak Master', 'Maintain a 7-day coding streak', 'flame', 'engagement', 100, 'epic', '{"streak_days": 7}'),
('Video Creator', 'Generate your first AI video explanation', 'video', 'content', 25, 'rare', '{"videos_generated": 1}')
ON CONFLICT (name) DO NOTHING;

-- Insert sample challenges
INSERT INTO challenges (title, description, problem_statement, difficulty, category, points, test_cases, starter_code) VALUES
('Two Sum', 'Find two numbers that add up to target', 'Given an array of integers and a target sum, return indices of two numbers that add up to the target.', 'easy', 'arrays', 10,
 '[{"input": "[2,7,11,15], 9", "output": "[0,1]"}, {"input": "[3,2,4], 6", "output": "[1,2]"}]',
 '{"javascript": "function twoSum(nums, target) {\n  // Your code here\n}", "python": "def two_sum(nums, target):\n    # Your code here\n    pass"}'),
('Reverse String', 'Reverse a string in-place', 'Write a function that reverses a string. The input string is given as an array of characters.', 'easy', 'strings', 10,
 '[{"input": "[\"h\",\"e\",\"l\",\"l\",\"o\"]", "output": "[\"o\",\"l\",\"l\",\"e\",\"h\"]"}]',
 '{"javascript": "function reverseString(s) {\n  // Your code here\n}", "python": "def reverse_string(s):\n    # Your code here\n    pass"}')
ON CONFLICT (title) DO NOTHING;

-- Insert learning paths
INSERT INTO learning_paths (title, description, difficulty, estimated_hours, modules) VALUES
('JavaScript Fundamentals', 'Master the basics of JavaScript programming', 'beginner', 20,
 '[{"title": "Variables and Data Types", "duration": 2}, {"title": "Functions and Scope", "duration": 3}, {"title": "Objects and Arrays", "duration": 4}]'),
('Algorithm Design', 'Learn to design efficient algorithms', 'intermediate', 40,
 '[{"title": "Time Complexity", "duration": 5}, {"title": "Sorting Algorithms", "duration": 8}, {"title": "Graph Algorithms", "duration": 12}]')
ON CONFLICT (title) DO NOTHING;

-- Insert feature flags
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage) VALUES
('video_generation', 'Enable AI video generation feature', true, 100),
('advanced_analytics', 'Enable advanced analytics dashboard', false, 0),
('team_collaboration', 'Enable team collaboration features', false, 10),
('ai_code_review', 'Enable AI-powered code review', true, 50)
ON CONFLICT (name) DO NOTHING;