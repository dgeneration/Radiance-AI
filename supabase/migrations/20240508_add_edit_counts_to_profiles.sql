-- Add edit count fields for personal information to user_profiles table
-- Note: This migration is for future use and is not currently applied to the database
-- To apply this migration, you need to run it manually in the Supabase SQL editor
-- or use the Supabase CLI to apply it

/*
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS first_name_edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_name_edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS country_edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS state_edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS city_edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS zip_code_edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gender_edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS birth_year_edit_count INTEGER DEFAULT 0;
*/
