-- ============================================================
-- Calibrate — Initial Schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- ----------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------

CREATE TYPE career_stage AS ENUM ('student', 'candidate', 'certified', 'supervisor');
CREATE TYPE modality AS ENUM ('ssep', 'mep', 'emg_free', 'emg_triggered', 'eeg', 'baep', 'vep', 'dwave');
CREATE TYPE case_type AS ENUM (
  'cervical', 'lumbar', 'scoliosis', 'carotid', 'vascular',
  'supratentorial', 'posterior_fossa', 'skull_base',
  'peripheral_nerve', 'spinal_tumor', 'tethered_cord', 'pediatric'
);
CREATE TYPE card_type AS ENUM ('didactic', 'clinical');
CREATE TYPE fsrs_state AS ENUM ('new', 'learning', 'review', 'relearning');
CREATE TYPE credential_type AS ENUM ('trainer', 'educator', 'fellow');
CREATE TYPE credential_status AS ENUM ('active', 'warning', 'paused');
CREATE TYPE subscription_plan AS ENUM ('monthly', 'annual', 'lifetime', 'team');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
CREATE TYPE score_type AS ENUM (
  'or_readiness',
  'cervical', 'lumbar', 'scoliosis', 'carotid', 'vascular',
  'supratentorial', 'posterior_fossa', 'skull_base',
  'peripheral_nerve', 'spinal_tumor', 'tethered_cord', 'pediatric'
);

-- ----------------------------------------------------------------
-- EMPLOYERS (created before profiles to allow FK)
-- ----------------------------------------------------------------

CREATE TABLE employers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  seat_count       INTEGER NOT NULL DEFAULT 1,
  admin_user_id    UUID,              -- FK to profiles added after profiles table
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------

CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  full_name        TEXT,
  career_stage     career_stage NOT NULL DEFAULT 'student',
  employer_id      UUID REFERENCES employers(id) ON DELETE SET NULL,
  xp               INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  streak           INTEGER NOT NULL DEFAULT 0,
  streak_shield    BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE = shield earned, not yet used
  last_review_date DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Now add the FK from employers back to profiles
ALTER TABLE employers
  ADD CONSTRAINT fk_employers_admin_user
  FOREIGN KEY (admin_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------
-- CARDS
-- ----------------------------------------------------------------

CREATE TABLE cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  front        TEXT NOT NULL,
  back         TEXT NOT NULL,
  explanation  TEXT,
  modality     modality NOT NULL,
  case_type    case_type NOT NULL,
  card_type    card_type NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- CARD_REVIEWS  (FSRS state per user per card — upsert on review)
-- ----------------------------------------------------------------

CREATE TABLE card_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id         UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  -- FSRS v5 fields
  due             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stability       REAL NOT NULL DEFAULT 0,
  difficulty      REAL NOT NULL DEFAULT 0,
  elapsed_days    INTEGER NOT NULL DEFAULT 0,
  scheduled_days  INTEGER NOT NULL DEFAULT 0,
  reps            INTEGER NOT NULL DEFAULT 0,
  lapses          INTEGER NOT NULL DEFAULT 0,
  state           fsrs_state NOT NULL DEFAULT 'new',
  last_review     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, card_id)
);

CREATE INDEX idx_card_reviews_due ON card_reviews (user_id, due);

-- ----------------------------------------------------------------
-- REVIEW_LOG  (append-only — insert only, never update)
-- ----------------------------------------------------------------

CREATE TABLE review_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id         UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  rating          SMALLINT NOT NULL CHECK (rating IN (1, 2, 3)),  -- 1=Missed, 2=Almost, 3=Got it
  fsrs_state      fsrs_state NOT NULL,
  scheduled_days  INTEGER NOT NULL DEFAULT 0,
  elapsed_days    INTEGER NOT NULL DEFAULT 0,
  reviewed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_log_user_date ON review_log (user_id, reviewed_at DESC);

-- ----------------------------------------------------------------
-- READINESS_SCORES  (cached nightly + on-demand)
-- ----------------------------------------------------------------

CREATE TABLE readiness_scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score_type   score_type NOT NULL,
  score        SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  percentile   SMALLINT CHECK (percentile BETWEEN 0 AND 100),
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, score_type)
);

-- ----------------------------------------------------------------
-- CREDENTIALS
-- ----------------------------------------------------------------

CREATE TABLE credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_type credential_type NOT NULL,
  status          credential_status NOT NULL DEFAULT 'active',
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, credential_type)
);

-- ----------------------------------------------------------------
-- BADGES
-- ----------------------------------------------------------------

CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key   TEXT NOT NULL,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_key)
);

-- ----------------------------------------------------------------
-- CE_MODULES
-- ----------------------------------------------------------------

CREATE TABLE ce_modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  credits      REAL NOT NULL DEFAULT 1.0,
  content_url  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- CE_COMPLETIONS
-- ----------------------------------------------------------------

CREATE TABLE ce_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id       UUID NOT NULL REFERENCES ce_modules(id) ON DELETE CASCADE,
  progress        REAL NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),
  completed_at    TIMESTAMPTZ,
  certificate_url TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_id)
);

-- ----------------------------------------------------------------
-- SUBSCRIPTIONS
-- ----------------------------------------------------------------

CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan                  subscription_plan NOT NULL,
  status                subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ----------------------------------------------------------------
-- SHARE_LINKS
-- ----------------------------------------------------------------

CREATE TABLE share_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token            TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  show_name        BOOLEAN NOT NULL DEFAULT TRUE,
  show_scores      BOOLEAN NOT NULL DEFAULT TRUE,
  show_credentials BOOLEAN NOT NULL DEFAULT TRUE,
  show_badges      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)   -- one share link per user
);

-- ----------------------------------------------------------------
-- UPDATED_AT triggers
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employers_updated_at       BEFORE UPDATE ON employers       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated_at        BEFORE UPDATE ON profiles        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cards_updated_at           BEFORE UPDATE ON cards           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_card_reviews_updated_at    BEFORE UPDATE ON card_reviews    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_readiness_updated_at       BEFORE UPDATE ON readiness_scores FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_credentials_updated_at     BEFORE UPDATE ON credentials     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ce_modules_updated_at      BEFORE UPDATE ON ce_modules      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ce_completions_updated_at  BEFORE UPDATE ON ce_completions  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at   BEFORE UPDATE ON subscriptions   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_share_links_updated_at     BEFORE UPDATE ON share_links     FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------
-- AUTO-CREATE PROFILE ON SIGNUP
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE employers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials     ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ce_modules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ce_completions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links     ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- profiles policies
-- ----------------------------------------------------------------

CREATE POLICY "profiles: user reads own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: user updates own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Employers can read profiles of their staff (READ only, never write)
CREATE POLICY "profiles: employer reads staff"
  ON profiles FOR SELECT
  USING (
    employer_id IS NOT NULL AND
    employer_id IN (
      SELECT id FROM employers WHERE admin_user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- employers policies
-- ----------------------------------------------------------------

CREATE POLICY "employers: admin reads own"
  ON employers FOR SELECT
  USING (admin_user_id = auth.uid());

CREATE POLICY "employers: admin updates own"
  ON employers FOR UPDATE
  USING (admin_user_id = auth.uid());

-- ----------------------------------------------------------------
-- cards policies (read-only for all authenticated users)
-- ----------------------------------------------------------------

CREATE POLICY "cards: authenticated users can read"
  ON cards FOR SELECT
  USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- card_reviews policies
-- ----------------------------------------------------------------

CREATE POLICY "card_reviews: user reads own"
  ON card_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "card_reviews: user inserts own"
  ON card_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "card_reviews: user updates own"
  ON card_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- review_log policies (insert + read own; no update/delete)
-- ----------------------------------------------------------------

CREATE POLICY "review_log: user reads own"
  ON review_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "review_log: user inserts own"
  ON review_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- readiness_scores policies
-- ----------------------------------------------------------------

CREATE POLICY "readiness_scores: user reads own"
  ON readiness_scores FOR SELECT
  USING (auth.uid() = user_id);

-- Employer reads staff scores
CREATE POLICY "readiness_scores: employer reads staff"
  ON readiness_scores FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM profiles
      WHERE employer_id IN (
        SELECT id FROM employers WHERE admin_user_id = auth.uid()
      )
    )
  );

-- ----------------------------------------------------------------
-- credentials policies
-- ----------------------------------------------------------------

CREATE POLICY "credentials: user reads own"
  ON credentials FOR SELECT
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- badges policies
-- ----------------------------------------------------------------

CREATE POLICY "badges: user reads own"
  ON badges FOR SELECT
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- ce_modules policies (read-only for all authenticated users)
-- ----------------------------------------------------------------

CREATE POLICY "ce_modules: authenticated users can read"
  ON ce_modules FOR SELECT
  USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- ce_completions policies
-- ----------------------------------------------------------------

CREATE POLICY "ce_completions: user reads own"
  ON ce_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ce_completions: user inserts own"
  ON ce_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ce_completions: user updates own"
  ON ce_completions FOR UPDATE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- subscriptions policies
-- ----------------------------------------------------------------

CREATE POLICY "subscriptions: user reads own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- share_links policies
-- ----------------------------------------------------------------

CREATE POLICY "share_links: user reads own"
  ON share_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "share_links: user inserts own"
  ON share_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "share_links: user updates own"
  ON share_links FOR UPDATE
  USING (auth.uid() = user_id);

-- Public profile lookup by token (unauthenticated — used by /p/[token] route)
CREATE POLICY "share_links: public read by token"
  ON share_links FOR SELECT
  USING (TRUE);   -- token filtering happens in the query; token is unguessable (128-bit hex)
