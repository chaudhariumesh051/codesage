-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  location text,
  timezone text DEFAULT 'UTC',
  
  -- Admin flag
  is_admin boolean DEFAULT false,
  
  -- Usage Tracking
  total_analyses integer DEFAULT 0,
  total_problems_solved integer DEFAULT 0,
  
  -- Metadata
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Theme preference
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'))
);

-- User Sessions Table (Multi-device tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  
  -- Device Information
  device_name text,
  browser text,
  os text,
  ip_address text,
  user_agent text,
  
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
    'suspicious_activity', 'session_expired'
  )),
  event_description text,
  
  -- Request Information
  ip_address text,
  user_agent text,
  
  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Code Analysis Preferences
  default_language text DEFAULT 'javascript',
  analysis_depth text DEFAULT 'standard' CHECK (analysis_depth IN ('quick', 'standard', 'detailed')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Code Submissions Table
CREATE TABLE IF NOT EXISTS code_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Code Information
  title text,
  description text,
  code_content text NOT NULL,
  language text NOT NULL,
  
  -- Metadata
  file_name text,
  line_count integer,
  character_count integer,
  
  -- Analysis Status
  analysis_status text DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Code Analyses Table
CREATE TABLE IF NOT EXISTS code_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES code_submissions(id) ON DELETE CASCADE,
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
  
  -- AI Model Information
  ai_model text DEFAULT 'gemini-2.0-flash',
  processing_time_ms integer,
  
  created_at timestamptz DEFAULT now()
);

-- Problem Solutions Table
CREATE TABLE IF NOT EXISTS problem_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Problem Information
  problem_title text NOT NULL,
  problem_statement text NOT NULL,
  
  -- Solution Information
  language text NOT NULL,
  solution_code text NOT NULL,
  explanation text,
  
  -- Complexity Analysis
  time_complexity text,
  space_complexity text,
  
  -- Test Cases and Optimizations
  test_cases jsonb DEFAULT '[]',
  optimizations jsonb DEFAULT '[]',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Message Information
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

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

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for code_submissions
CREATE POLICY "Users can manage own submissions"
  ON code_submissions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for code_analyses
CREATE POLICY "Users can manage own analyses"
  ON code_analyses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for problem_solutions
CREATE POLICY "Users can manage own solutions"
  ON problem_solutions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for chat_history
CREATE POLICY "Users can manage own chat history"
  ON chat_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin policies for all tables (fixed to avoid recursion)
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "Admins can view all code submissions"
  ON code_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "Admins can view all code analyses"
  ON code_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "Admins can view all problem solutions"
  ON problem_solutions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

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

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_code_submissions_updated_at
  BEFORE UPDATE ON code_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_solutions_updated_at
  BEFORE UPDATE ON problem_solutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(
  user_id_param uuid,
  feature_type text
)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    total_analyses = CASE 
      WHEN feature_type = 'code_analysis' THEN total_analyses + 1
      ELSE total_analyses
    END,
    total_problems_solved = CASE 
      WHEN feature_type = 'problem_solving' THEN total_problems_solved + 1
      ELSE total_problems_solved
    END,
    updated_at = now()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_security_logs_user_id ON user_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_logs_event_type ON user_security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_code_submissions_user_id ON code_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_analyses_user_id ON code_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_solutions_user_id ON problem_solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);

-- Create a function to handle new users (will be used by a trigger in a separate migration)
CREATE OR REPLACE FUNCTION public.handle_new_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  -- Log the registration
  INSERT INTO user_security_logs (user_id, email, event_type, event_description)
  VALUES (NEW.id, NEW.email, 'login_success', 'User account created');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We don't create the trigger here since it already exists
-- The trigger will be created in a separate migration if needed