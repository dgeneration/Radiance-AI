-- Add medical report columns to diagnoses table
ALTER TABLE diagnoses
ADD COLUMN IF NOT EXISTS medical_report_url TEXT,
ADD COLUMN IF NOT EXISTS medical_report_name TEXT,
ADD COLUMN IF NOT EXISTS medical_report_type TEXT;
