-- ============================================================
-- Fix career_stage column to accept all four valid values
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Drop the existing check constraint (if any)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_career_stage_check;

-- 2. Ensure the column is nullable so existing NULL rows are valid
--    (users who signed up before completing onboarding)
ALTER TABLE profiles ALTER COLUMN career_stage DROP NOT NULL;

-- 3. Add the correct check constraint with all four valid career stages
ALTER TABLE profiles ADD CONSTRAINT profiles_career_stage_check
  CHECK (career_stage IS NULL OR career_stage IN ('student', 'candidate', 'certified', 'supervisor'));
