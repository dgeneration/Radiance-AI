-- Create radiance_chat_messages table for storing chat history
CREATE TABLE IF NOT EXISTS radiance_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chain_diagnosis_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  raw_api_response JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS radiance_chat_messages_session_id_idx ON radiance_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS radiance_chat_messages_user_id_idx ON radiance_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS radiance_chat_messages_created_at_idx ON radiance_chat_messages(created_at);

-- Set up Row Level Security (RLS)
ALTER TABLE radiance_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only view their own chat messages
CREATE POLICY "Users can view their own chat messages"
ON radiance_chat_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own chat messages
CREATE POLICY "Users can insert their own chat messages"
ON radiance_chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own chat messages
CREATE POLICY "Users can update their own chat messages"
ON radiance_chat_messages
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own chat messages
CREATE POLICY "Users can delete their own chat messages"
ON radiance_chat_messages
FOR DELETE
USING (auth.uid() = user_id);
