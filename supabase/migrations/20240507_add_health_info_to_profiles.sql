-- Add health information fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS health_history TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS medications TEXT,
ADD COLUMN IF NOT EXISTS has_edited_health_info BOOLEAN DEFAULT FALSE;
