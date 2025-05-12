-- This migration fixes the chain_diagnosis_sessions table and its RLS policies
-- Run this in the Supabase SQL Editor if you're experiencing issues with the chain diagnosis system

-- Create the chain_diagnosis_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS chain_diagnosis_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_input JSONB NOT NULL,
  medical_analyst_response JSONB,
  general_physician_response JSONB,
  specialist_doctor_response JSONB,
  pathologist_response JSONB,
  nutritionist_response JSONB,
  pharmacist_response JSONB,
  follow_up_specialist_response JSONB,
  summarizer_response JSONB,
  status TEXT NOT NULL DEFAULT 'in_progress',
  current_step INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS chain_diagnosis_sessions_user_id_idx ON chain_diagnosis_sessions(user_id);
CREATE INDEX IF NOT EXISTS chain_diagnosis_sessions_created_at_idx ON chain_diagnosis_sessions(created_at);
CREATE INDEX IF NOT EXISTS chain_diagnosis_sessions_status_idx ON chain_diagnosis_sessions(status);

-- Enable Row Level Security
ALTER TABLE chain_diagnosis_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own chain diagnosis sessions" ON chain_diagnosis_sessions;
DROP POLICY IF EXISTS "Users can insert their own chain diagnosis sessions" ON chain_diagnosis_sessions;
DROP POLICY IF EXISTS "Users can update their own chain diagnosis sessions" ON chain_diagnosis_sessions;
DROP POLICY IF EXISTS "Users can delete their own chain diagnosis sessions" ON chain_diagnosis_sessions;

-- Create RLS policies
-- Users can only view their own sessions
CREATE POLICY "Users can view their own chain diagnosis sessions"
ON chain_diagnosis_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own sessions
CREATE POLICY "Users can insert their own chain diagnosis sessions"
ON chain_diagnosis_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own sessions
CREATE POLICY "Users can update their own chain diagnosis sessions"
ON chain_diagnosis_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own sessions
CREATE POLICY "Users can delete their own chain diagnosis sessions"
ON chain_diagnosis_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Create the execute_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION execute_sql(sql text) 
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
