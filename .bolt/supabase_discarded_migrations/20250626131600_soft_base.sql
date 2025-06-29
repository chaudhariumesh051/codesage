/*
  # CodeSage Challenges & Learning System

  1. New Tables
    - `challenges` - Coding challenges and problems
    - `user_challenge_attempts` - User attempts at challenges
    - `learning_paths` - Structured learning journeys
    - `user_progress` - User progress tracking
    - `achievements` - User achievements and badges
    
  2. Security
    - Enable RLS on all tables
    - Public read access for challenges and learning paths
    - Users can only access their own progress data
    
  3. Features
    - Challenge management system
    - Progress tracking
    - Achievement system
    - Learning path recommendations
*/

-- Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Challenge Information
  title text NOT NULL,
  description text NOT NULL,
  problem_statement text NOT NULL,
  
  -- Challenge Details
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  
  -- Points and Rewards
  points integer DEFAULT 10,
  xp_reward integer DEFAULT 10,
  
  -- Challenge Configuration
  time_limit_minutes integer,
  memory_limit_mb integer,
  allowed_languages text[] DEFAULT '{"javascript", "python", "java", "cpp"}',
  
  -- Test Cases
  test_cases jsonb NOT NULL DEFAULT '[]',
  hidden_test_cases jsonb DEFAULT '[]',
  
  -- Solution Information
  solution_code text,
  solution_explanation text,
  hints jsonb DEFAULT '[]',
  
  -- Learning Resources
  related_concepts text[],
  prerequisites text[],
  learning_resources jsonb DEFAULT '[]',
  
  -- Challenge Status
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  
  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Challenge Attempts Table
CREATE TABLE IF NOT EXISTS user_challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  
  -- Attempt Information
  attempt_number integer DEFAULT 1,
  language text NOT NULL,
  code_submission text NOT NULL,
  
  -- Results
  status text NOT NULL CHECK (status IN ('pending', 'running', 'passed', 'failed', 'timeout', 'error')),
  score integer DEFAULT 0,
  tests_passed integer DEFAULT 0,
  tests_failed integer DEFAULT 0,
  
  -- Performance Metrics
  execution_time_ms integer,
  memory_used_mb decimal,
  
  -- Test Results
  test_results jsonb DEFAULT '[]',
  error_message text,
  
  -- Timing
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  time_taken_minutes integer,
  
  -- Metadata
  submission_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Learning Paths Table
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Path Information
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  
  -- Path Configuration
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_hours integer,
  
  -- Path Structure
  modules jsonb NOT NULL DEFAULT '[]', -- Array of module objects
  prerequisites text[],
  learning_objectives text[],
  
  -- Path Status
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  
  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Progress Tracking
  total_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,
  xp_to_next_level integer DEFAULT 100,
  
  -- Challenge Progress
  challenges_completed integer DEFAULT 0,
  challenges_attempted integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_challenge_date date,
  
  -- Learning Path Progress
  active_learning_paths uuid[] DEFAULT '{}',
  completed_learning_paths uuid[] DEFAULT '{}',
  
  -- Skill Levels
  skill_levels jsonb DEFAULT '{}', -- e.g., {"javascript": 5, "python": 3}
  
  -- Time Tracking
  total_study_time_minutes integer DEFAULT 0,
  weekly_study_time_minutes integer DEFAULT 0,
  
  -- Achievements
  total_achievements integer DEFAULT 0,
  recent_achievements uuid[] DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Achievement Information
  title text NOT NULL,
  description text NOT NULL,
  icon text,
  
  -- Achievement Type
  type text NOT NULL CHECK (type IN ('challenge', 'streak', 'skill', 'time', 'special')),
  category text,
  
  -- Requirements
  requirements jsonb NOT NULL DEFAULT '{}',
  points_reward integer DEFAULT 0,
  xp_reward integer DEFAULT 0,
  
  -- Achievement Status
  is_active boolean DEFAULT true,
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  
  created_at timestamptz DEFAULT now()
);

-- User Achievements Table (Junction table)
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  
  -- Achievement Details
  earned_at timestamptz DEFAULT now(),
  progress_data jsonb DEFAULT '{}',
  
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (public read)
CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage challenges"
  ON challenges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for user_challenge_attempts
CREATE POLICY "Users can manage own attempts"
  ON user_challenge_attempts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for learning_paths (public read)
CREATE POLICY "Anyone can view active learning paths"
  ON learning_paths FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage learning paths"
  ON learning_paths FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for user_progress
CREATE POLICY "Users can manage own progress"
  ON user_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Functions for challenge system
CREATE OR REPLACE FUNCTION submit_challenge_attempt(
  p_challenge_id uuid,
  p_language text,
  p_code_submission text
)
RETURNS uuid AS $$
DECLARE
  attempt_id uuid;
  attempt_count integer;
BEGIN
  -- Get current attempt count
  SELECT COALESCE(MAX(attempt_number), 0) + 1
  INTO attempt_count
  FROM user_challenge_attempts
  WHERE user_id = auth.uid() AND challenge_id = p_challenge_id;
  
  -- Insert attempt
  INSERT INTO user_challenge_attempts (
    user_id, challenge_id, attempt_number, language, code_submission
  ) VALUES (
    auth.uid(), p_challenge_id, attempt_count, p_language, p_code_submission
  ) RETURNING id INTO attempt_id;
  
  RETURN attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update challenge attempt result
CREATE OR REPLACE FUNCTION update_challenge_result(
  p_attempt_id uuid,
  p_status text,
  p_score integer,
  p_tests_passed integer,
  p_tests_failed integer,
  p_execution_time_ms integer DEFAULT NULL,
  p_test_results jsonb DEFAULT '[]'
)
RETURNS void AS $$
DECLARE
  challenge_points integer;
  user_id_val uuid;
  challenge_id_val uuid;
BEGIN
  -- Get attempt details
  SELECT user_id, challenge_id INTO user_id_val, challenge_id_val
  FROM user_challenge_attempts
  WHERE id = p_attempt_id;
  
  -- Update attempt
  UPDATE user_challenge_attempts
  SET 
    status = p_status,
    score = p_score,
    tests_passed = p_tests_passed,
    tests_failed = p_tests_failed,
    execution_time_ms = p_execution_time_ms,
    test_results = p_test_results,
    completed_at = now(),
    time_taken_minutes = EXTRACT(EPOCH FROM (now() - started_at)) / 60
  WHERE id = p_attempt_id;
  
  -- If challenge passed, update user progress
  IF p_status = 'passed' THEN
    -- Get challenge points
    SELECT points INTO challenge_points
    FROM challenges
    WHERE id = challenge_id_val;
    
    -- Update user progress
    INSERT INTO user_progress (user_id)
    VALUES (user_id_val)
    ON CONFLICT (user_id) DO UPDATE SET
      total_xp = user_progress.total_xp + challenge_points,
      challenges_completed = user_progress.challenges_completed + 1,
      current_streak = CASE 
        WHEN user_progress.last_challenge_date = CURRENT_DATE - INTERVAL '1 day' 
        THEN user_progress.current_streak + 1
        WHEN user_progress.last_challenge_date = CURRENT_DATE
        THEN user_progress.current_streak
        ELSE 1
      END,
      longest_streak = GREATEST(
        user_progress.longest_streak,
        CASE 
          WHEN user_progress.last_challenge_date = CURRENT_DATE - INTERVAL '1 day' 
          THEN user_progress.current_streak + 1
          WHEN user_progress.last_challenge_date = CURRENT_DATE
          THEN user_progress.current_streak
          ELSE 1
        END
      ),
      last_challenge_date = CURRENT_DATE,
      updated_at = now();
    
    -- Check for achievements
    PERFORM check_and_award_achievements(user_id_val);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id uuid)
RETURNS void AS $$
DECLARE
  user_progress_record user_progress%ROWTYPE;
  achievement_record achievements%ROWTYPE;
BEGIN
  -- Get user progress
  SELECT * INTO user_progress_record
  FROM user_progress
  WHERE user_id = p_user_id;
  
  -- Check each achievement
  FOR achievement_record IN 
    SELECT * FROM achievements 
    WHERE is_active = true 
    AND id NOT IN (
      SELECT achievement_id 
      FROM user_achievements 
      WHERE user_id = p_user_id
    )
  LOOP
    -- Check if user meets requirements
    IF check_achievement_requirements(p_user_id, achievement_record.requirements) THEN
      -- Award achievement
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (p_user_id, achievement_record.id);
      
      -- Update user progress
      UPDATE user_progress
      SET 
        total_achievements = total_achievements + 1,
        recent_achievements = array_prepend(achievement_record.id, recent_achievements[1:4]),
        total_xp = total_xp + achievement_record.xp_reward,
        updated_at = now()
      WHERE user_id = p_user_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check achievement requirements
CREATE OR REPLACE FUNCTION check_achievement_requirements(
  p_user_id uuid,
  p_requirements jsonb
)
RETURNS boolean AS $$
DECLARE
  user_progress_record user_progress%ROWTYPE;
  requirement_type text;
  requirement_value integer;
BEGIN
  -- Get user progress
  SELECT * INTO user_progress_record
  FROM user_progress
  WHERE user_id = p_user_id;
  
  -- Extract requirement type and value
  requirement_type := p_requirements->>'type';
  requirement_value := (p_requirements->>'value')::integer;
  
  -- Check different requirement types
  CASE requirement_type
    WHEN 'challenges_completed' THEN
      RETURN user_progress_record.challenges_completed >= requirement_value;
    WHEN 'current_streak' THEN
      RETURN user_progress_record.current_streak >= requirement_value;
    WHEN 'total_xp' THEN
      RETURN user_progress_record.total_xp >= requirement_value;
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_featured ON challenges(is_featured);

CREATE INDEX IF NOT EXISTS idx_user_challenge_attempts_user_id ON user_challenge_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_attempts_challenge_id ON user_challenge_attempts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_attempts_status ON user_challenge_attempts(status);
CREATE INDEX IF NOT EXISTS idx_user_challenge_attempts_created_at ON user_challenge_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_learning_paths_category ON learning_paths(category);
CREATE INDEX IF NOT EXISTS idx_learning_paths_difficulty ON learning_paths(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_paths_active ON learning_paths(is_active);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(current_level);
CREATE INDEX IF NOT EXISTS idx_user_progress_xp ON user_progress(total_xp);

CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(type);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at);