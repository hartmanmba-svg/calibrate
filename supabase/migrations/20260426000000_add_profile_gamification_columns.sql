-- ============================================================
-- Add gamification columns missing from the production profiles table.
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp               INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level            INTEGER     NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS streak           INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_shield    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_review_date TEXT;

NOTIFY pgrst, 'reload schema';
