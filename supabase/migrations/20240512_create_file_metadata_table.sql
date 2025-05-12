-- Create file_metadata table
CREATE TABLE IF NOT EXISTS public.file_metadata (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  public_url TEXT
);

-- Add RLS policies
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own files
CREATE POLICY "Users can view their own files"
ON public.file_metadata
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own files
CREATE POLICY "Users can insert their own files"
ON public.file_metadata
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON public.file_metadata
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS file_metadata_user_id_idx ON public.file_metadata (user_id);
