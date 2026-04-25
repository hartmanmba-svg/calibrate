-- Add employer_id to profiles if it doesn't exist (FK to employers)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES employers(id) ON DELETE SET NULL;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
