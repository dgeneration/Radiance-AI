-- Create a storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the medical-reports bucket
-- Allow users to upload their own files
CREATE POLICY "Users can upload their own medical reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own files
CREATE POLICY "Users can view their own medical reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own files
CREATE POLICY "Users can update their own medical reports"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own medical reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
