-- Weekly case answer tracking with idempotency (one answer per user per case).
CREATE TABLE IF NOT EXISTS weekly_case_answers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  case_id       text NOT NULL,
  selected_index integer NOT NULL,
  is_correct    boolean NOT NULL,
  xp_earned     integer NOT NULL,
  answered_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, case_id)
);

ALTER TABLE weekly_case_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own answers"
  ON weekly_case_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own answers"
  ON weekly_case_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);
