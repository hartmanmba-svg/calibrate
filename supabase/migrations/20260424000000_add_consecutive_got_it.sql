-- Add consecutive_got_it column to profiles for badge tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consecutive_got_it INTEGER NOT NULL DEFAULT 0;
