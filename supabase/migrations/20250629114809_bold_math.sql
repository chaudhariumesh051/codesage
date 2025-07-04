-- Create chat_history table for AI assistant conversations if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on chat_history if not already enabled
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own chat history" ON chat_history;

-- Create RLS policies for chat_history
CREATE POLICY "Users can manage their own chat history"
  ON chat_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for chat_history if they don't exist
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

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