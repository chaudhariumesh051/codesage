/*
  # CodeSage Code Analysis & Problem Solving System

  1. New Tables
    - `code_submissions` - Store user code submissions
    - `code_analyses` - AI analysis results
    - `problem_solutions` - Generated solutions for problems
    - `code_execution_results` - Code execution history
    - `flowcharts` - Generated flowchart data
    
  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Admins have full access
    
  3. Features
    - Code submission history
    - AI analysis tracking
    - Problem solving workflow
    - Execution results storage
    - Flowchart generation
*/

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
  submission_type text DEFAULT 'analysis' CHECK (submission_type IN ('analysis', 'problem_solving', 'challenge')),
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

-- Enable Row Level Security
ALTER TABLE code_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_execution_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE flowcharts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for code_submissions
CREATE POLICY "Users can manage own submissions"
  ON code_submissions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public submissions"
  ON code_submissions FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Admins can manage all submissions"
  ON code_submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for code_analyses
CREATE POLICY "Users can manage own analyses"
  ON code_analyses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analyses"
  ON code_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for problem_solutions
CREATE POLICY "Users can manage own solutions"
  ON problem_solutions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for code_execution_results
CREATE POLICY "Users can manage own execution results"
  ON code_execution_results FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for flowcharts
CREATE POLICY "Users can manage own flowcharts"
  ON flowcharts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Functions for code analysis workflow
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

-- Function to save analysis results
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

-- Function to save problem solution
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

-- Function to save execution result
CREATE OR REPLACE FUNCTION save_execution_result(
  p_submission_id uuid,
  p_language text,
  p_code_content text,
  p_status text,
  p_output text,
  p_error_message text DEFAULT NULL,
  p_execution_time_ms integer DEFAULT NULL,
  p_memory_used_mb decimal DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  result_id uuid;
BEGIN
  INSERT INTO code_execution_results (
    user_id, submission_id, language, code_content, status,
    output, error_message, execution_time_ms, memory_used_mb
  ) VALUES (
    auth.uid(), p_submission_id, p_language, p_code_content, p_status,
    p_output, p_error_message, p_execution_time_ms, p_memory_used_mb
  ) RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_code_submissions_user_id ON code_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_submissions_language ON code_submissions(language);
CREATE INDEX IF NOT EXISTS idx_code_submissions_type ON code_submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_code_submissions_status ON code_submissions(analysis_status);
CREATE INDEX IF NOT EXISTS idx_code_submissions_created_at ON code_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_code_submissions_public ON code_submissions(is_public);

CREATE INDEX IF NOT EXISTS idx_code_analyses_submission_id ON code_analyses(submission_id);
CREATE INDEX IF NOT EXISTS idx_code_analyses_user_id ON code_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_code_analyses_score ON code_analyses(score);
CREATE INDEX IF NOT EXISTS idx_code_analyses_created_at ON code_analyses(created_at);

CREATE INDEX IF NOT EXISTS idx_problem_solutions_user_id ON problem_solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_solutions_language ON problem_solutions(language);
CREATE INDEX IF NOT EXISTS idx_problem_solutions_difficulty ON problem_solutions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_problem_solutions_created_at ON problem_solutions(created_at);

CREATE INDEX IF NOT EXISTS idx_code_execution_results_user_id ON code_execution_results(user_id);
CREATE INDEX IF NOT EXISTS idx_code_execution_results_status ON code_execution_results(status);
CREATE INDEX IF NOT EXISTS idx_code_execution_results_created_at ON code_execution_results(created_at);

CREATE INDEX IF NOT EXISTS idx_flowcharts_user_id ON flowcharts(user_id);
CREATE INDEX IF NOT EXISTS idx_flowcharts_type ON flowcharts(flowchart_type);
CREATE INDEX IF NOT EXISTS idx_flowcharts_created_at ON flowcharts(created_at);