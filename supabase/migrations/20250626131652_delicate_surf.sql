/*
  # CodeSage Media Storage & Video System

  1. New Tables
    - `media_files` - Store metadata for all media files
    - `video_generations` - Track AI video generation requests
    - `flowchart_exports` - Store exported flowchart files
    - `voice_narrations` - Store voice narration files
    
  2. Storage Buckets
    - `flowcharts` - For flowchart diagrams (SVG, PNG, PDF)
    - `videos` - For generated video files (MP4)
    - `audio` - For voice narrations (MP3, WAV)
    - `exports` - For user exports and downloads
    
  3. Security
    - Enable RLS on all tables
    - Bucket policies for secure file access
    - User-specific file access controls
*/

-- Media Files Table (Central file registry)
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- File Information
  file_name text NOT NULL,
  original_name text,
  file_type text NOT NULL, -- 'image', 'video', 'audio', 'document'
  mime_type text NOT NULL,
  file_size_bytes bigint,
  
  -- Storage Information
  bucket_name text NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  
  -- File Metadata
  width integer, -- For images/videos
  height integer, -- For images/videos
  duration_seconds decimal, -- For videos/audio
  
  -- Processing Status
  processing_status text DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'completed', 'failed')),
  processing_error text,
  
  -- Usage Tracking
  download_count integer DEFAULT 0,
  last_accessed_at timestamptz,
  
  -- Relationships
  submission_id uuid REFERENCES code_submissions(id) ON DELETE CASCADE,
  solution_id uuid REFERENCES problem_solutions(id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES code_analyses(id) ON DELETE CASCADE,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Video Generations Table
CREATE TABLE IF NOT EXISTS video_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Request Information
  problem_title text NOT NULL,
  script_content text NOT NULL,
  language text NOT NULL,
  
  -- Tavus Configuration
  tavus_video_id text UNIQUE,
  replica_id text,
  persona_id text,
  background_url text,
  
  -- Video Settings
  voice_settings jsonb DEFAULT '{}',
  video_settings jsonb DEFAULT '{}',
  script_options jsonb DEFAULT '{}',
  
  -- Generation Status
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'generating', 'processing', 'completed', 'failed')),
  progress_percentage integer DEFAULT 0,
  error_message text,
  
  -- Results
  video_url text,
  thumbnail_url text,
  duration_seconds decimal,
  file_size_bytes bigint,
  
  -- Processing Times
  started_at timestamptz,
  completed_at timestamptz,
  processing_time_seconds integer,
  
  -- Relationships
  submission_id uuid REFERENCES code_submissions(id) ON DELETE CASCADE,
  solution_id uuid REFERENCES problem_solutions(id) ON DELETE CASCADE,
  media_file_id uuid REFERENCES media_files(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Flowchart Exports Table
CREATE TABLE IF NOT EXISTS flowchart_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flowchart_id uuid REFERENCES flowcharts(id) ON DELETE CASCADE NOT NULL,
  
  -- Export Information
  export_format text NOT NULL CHECK (export_format IN ('svg', 'png', 'pdf', 'jpg')),
  file_name text NOT NULL,
  file_size_bytes bigint,
  
  -- Export Settings
  width integer,
  height integer,
  dpi integer DEFAULT 300,
  background_color text DEFAULT 'white',
  
  -- Storage Information
  storage_path text NOT NULL,
  public_url text,
  
  -- Status
  export_status text DEFAULT 'pending' CHECK (export_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  
  -- Relationships
  media_file_id uuid REFERENCES media_files(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Voice Narrations Table
CREATE TABLE IF NOT EXISTS voice_narrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Narration Information
  script_text text NOT NULL,
  language text DEFAULT 'en',
  voice_id text,
  voice_name text,
  
  -- ElevenLabs Configuration
  elevenlabs_voice_id text,
  voice_settings jsonb DEFAULT '{}',
  
  -- Audio Information
  audio_format text DEFAULT 'mp3' CHECK (audio_format IN ('mp3', 'wav', 'ogg')),
  duration_seconds decimal,
  file_size_bytes bigint,
  
  -- Generation Status
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'generating', 'completed', 'failed')),
  error_message text,
  
  -- Results
  audio_url text,
  storage_path text,
  
  -- Processing Times
  started_at timestamptz,
  completed_at timestamptz,
  processing_time_seconds integer,
  
  -- Relationships
  video_generation_id uuid REFERENCES video_generations(id) ON DELETE CASCADE,
  media_file_id uuid REFERENCES media_files(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flowchart_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_narrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_files
CREATE POLICY "Users can manage own media files"
  ON media_files FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for video_generations
CREATE POLICY "Users can manage own video generations"
  ON video_generations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for flowchart_exports
CREATE POLICY "Users can manage own flowchart exports"
  ON flowchart_exports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for voice_narrations
CREATE POLICY "Users can manage own voice narrations"
  ON voice_narrations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Functions for media management
CREATE OR REPLACE FUNCTION create_video_generation_request(
  p_problem_title text,
  p_script_content text,
  p_language text,
  p_replica_id text DEFAULT NULL,
  p_persona_id text DEFAULT NULL,
  p_background_url text DEFAULT NULL,
  p_voice_settings jsonb DEFAULT '{}',
  p_video_settings jsonb DEFAULT '{}',
  p_script_options jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  generation_id uuid;
BEGIN
  -- Check if user can generate videos
  IF NOT check_rate_limit(auth.uid(), 'video_generation', 1) THEN
    RAISE EXCEPTION 'Video generation limit exceeded for free users';
  END IF;
  
  INSERT INTO video_generations (
    user_id, problem_title, script_content, language,
    replica_id, persona_id, background_url,
    voice_settings, video_settings, script_options
  ) VALUES (
    auth.uid(), p_problem_title, p_script_content, p_language,
    p_replica_id, p_persona_id, p_background_url,
    p_voice_settings, p_video_settings, p_script_options
  ) RETURNING id INTO generation_id;
  
  -- Increment usage count
  PERFORM increment_usage_count(auth.uid(), 'video_generation');
  
  RETURN generation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update video generation status
CREATE OR REPLACE FUNCTION update_video_generation_status(
  p_generation_id uuid,
  p_status text,
  p_progress_percentage integer DEFAULT NULL,
  p_tavus_video_id text DEFAULT NULL,
  p_video_url text DEFAULT NULL,
  p_thumbnail_url text DEFAULT NULL,
  p_duration_seconds decimal DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE video_generations
  SET 
    status = p_status,
    progress_percentage = COALESCE(p_progress_percentage, progress_percentage),
    tavus_video_id = COALESCE(p_tavus_video_id, tavus_video_id),
    video_url = COALESCE(p_video_url, video_url),
    thumbnail_url = COALESCE(p_thumbnail_url, thumbnail_url),
    duration_seconds = COALESCE(p_duration_seconds, duration_seconds),
    error_message = p_error_message,
    completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN now() ELSE completed_at END,
    processing_time_seconds = CASE 
      WHEN p_status IN ('completed', 'failed') AND started_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (now() - started_at))::integer
      ELSE processing_time_seconds
    END,
    updated_at = now()
  WHERE id = p_generation_id;
  
  -- If completed successfully, create media file record
  IF p_status = 'completed' AND p_video_url IS NOT NULL THEN
    INSERT INTO media_files (
      user_id, file_name, file_type, mime_type, bucket_name, 
      storage_path, public_url, duration_seconds
    )
    SELECT 
      user_id,
      problem_title || '_' || language || '_video.mp4',
      'video',
      'video/mp4',
      'videos',
      'videos/' || auth.uid()::text || '/' || p_generation_id::text || '.mp4',
      p_video_url,
      p_duration_seconds
    FROM video_generations
    WHERE id = p_generation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create flowchart export
CREATE OR REPLACE FUNCTION create_flowchart_export(
  p_flowchart_id uuid,
  p_export_format text,
  p_width integer DEFAULT NULL,
  p_height integer DEFAULT NULL,
  p_background_color text DEFAULT 'white'
)
RETURNS uuid AS $$
DECLARE
  export_id uuid;
  file_name text;
BEGIN
  -- Generate file name
  SELECT 
    'flowchart_' || f.id::text || '.' || p_export_format
  INTO file_name
  FROM flowcharts f
  WHERE f.id = p_flowchart_id;
  
  INSERT INTO flowchart_exports (
    user_id, flowchart_id, export_format, file_name,
    width, height, background_color,
    storage_path
  ) VALUES (
    auth.uid(), p_flowchart_id, p_export_format, file_name,
    p_width, p_height, p_background_color,
    'flowcharts/' || auth.uid()::text || '/' || gen_random_uuid()::text || '.' || p_export_format
  ) RETURNING id INTO export_id;
  
  RETURN export_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track file download
CREATE OR REPLACE FUNCTION track_file_download(p_media_file_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE media_files
  SET 
    download_count = download_count + 1,
    last_accessed_at = now(),
    updated_at = now()
  WHERE id = p_media_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_bucket ON media_files(bucket_name);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_status ON video_generations(status);
CREATE INDEX IF NOT EXISTS idx_video_generations_tavus_id ON video_generations(tavus_video_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_created_at ON video_generations(created_at);

CREATE INDEX IF NOT EXISTS idx_flowchart_exports_user_id ON flowchart_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_flowchart_exports_flowchart_id ON flowchart_exports(flowchart_id);
CREATE INDEX IF NOT EXISTS idx_flowchart_exports_format ON flowchart_exports(export_format);
CREATE INDEX IF NOT EXISTS idx_flowchart_exports_status ON flowchart_exports(export_status);

CREATE INDEX IF NOT EXISTS idx_voice_narrations_user_id ON voice_narrations(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_narrations_status ON voice_narrations(status);
CREATE INDEX IF NOT EXISTS idx_voice_narrations_video_id ON voice_narrations(video_generation_id);