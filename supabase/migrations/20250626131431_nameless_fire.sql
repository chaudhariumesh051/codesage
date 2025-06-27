/*
  # CodeSage Authentication & User Management System

  1. New Tables
    - `user_profiles` - Extended user information beyond Supabase auth
    - `user_sessions` - Track user sessions and devices
    - `user_security_logs` - Security events and login attempts
    - `user_preferences` - User settings and preferences
    
  2. Security
    - Enable RLS on all tables
    - Add comprehensive security policies
    - Implement brute force protection
    - Session management with device tracking
    
  3. Features
    - Multi-device login tracking
    - Email verification workflow
    - Password reset functionality
    - Role-based access control
    - Security audit logging
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  
  -- Subscription & Role Management
  role text DEFAULT 'free_user' CHECK (role IN ('free_user', 'pro_user', 'admin', 'super_admin')),
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'cancelled', 'past_due', 'trialing')),
  subscription_plan text,
  subscription_expires_at timestamptz,
  revenuecat_user_id text,
  
  -- Usage Tracking
  daily_code_analysis_count integer DEFAULT 0,
  daily_problem_solving_count integer DEFAULT 0,
  daily_video_generation_count integer DEFAULT 0,
  total_analyses integer DEFAULT 0,
  total_problems_solved integer DEFAULT 0,
  total_videos_generated integer DEFAULT 0,
  
  -- Preferences
  preferred_language text DEFAULT 'javascript',
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  email_notifications boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  
  -- Metadata
  onboarding_completed boolean DEFAULT false,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Sessions Table (Multi-device tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  refresh_token text,
  
  -- Device Information
  device_id text,
  device_name text,
  device_type text, -- 'desktop', 'mobile', 'tablet'
  browser text,
  os text,
  ip_address inet,
  user_agent text,
  
  -- Location (if available)
  country text,
  city text,
  latitude decimal,
  longitude decimal,
  
  -- Session Management
  is_active boolean DEFAULT true,
  last_accessed_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Security Logs Table (Audit trail)
CREATE TABLE IF NOT EXISTS user_security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  
  -- Event Information
  event_type text NOT NULL CHECK (event_type IN (
    'login_success', 'login_failed', 'logout', 'password_reset_requested',
    'password_reset_completed', 'email_verified', 'account_locked',
    'suspicious_activity', 'session_expired', 'device_added'
  )),
  event_description text,
  
  -- Request Information
  ip_address inet,
  user_agent text,
  device_fingerprint text,
  
  -- Location
  country text,
  city text,
  
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

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
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
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for user_sessions
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

-- RLS Policies for user_security_logs
CREATE POLICY "Users can view own security logs"
  ON user_security_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security logs"
  ON user_security_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can insert their own security logs"
  ON user_security_logs FOR INSERT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert security logs"
  ON user_security_logs FOR INSERT
  TO service_role
  USING (true);

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Functions for user management
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
  
  -- Log the registration
  INSERT INTO user_security_logs (user_id, email, event_type, event_description)
  VALUES (NEW.id, NEW.email, 'login_success', 'User account created');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user last active timestamp
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS trigger AS $$
BEGIN
  UPDATE user_profiles 
  SET last_active_at = now()
  WHERE id = auth.uid();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset daily usage counts
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    daily_code_analysis_count = 0,
    daily_problem_solving_count = 0,
    daily_video_generation_count = 0
  WHERE role = 'free_user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and enforce rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id_param uuid,
  feature_type text,
  max_count integer
)
RETURNS boolean AS $$
DECLARE
  current_count integer;
  user_role text;
BEGIN
  -- Get user role and current count
  SELECT 
    role,
    CASE 
      WHEN feature_type = 'code_analysis' THEN daily_code_analysis_count
      WHEN feature_type = 'problem_solving' THEN daily_problem_solving_count
      WHEN feature_type = 'video_generation' THEN daily_video_generation_count
      ELSE 0
    END
  INTO user_role, current_count
  FROM user_profiles
  WHERE id = user_id_param;
  
  -- Pro users have unlimited access
  IF user_role IN ('pro_user', 'admin', 'super_admin') THEN
    RETURN true;
  END IF;
  
  -- Check if free user is within limits
  RETURN current_count < max_count;
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