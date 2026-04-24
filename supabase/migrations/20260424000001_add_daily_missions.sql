-- Add daily_missions JSONB column to profiles for daily mission tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_missions JSONB;
