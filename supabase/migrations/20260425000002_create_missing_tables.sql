-- ============================================================
-- Create missing tables that app code references but don't
-- exist in the DB yet. Safe to re-run (IF NOT EXISTS).
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ----------------------------------------------------------------
-- ENUM types (idempotent)
-- ----------------------------------------------------------------

DO $$ BEGIN CREATE TYPE credential_type AS ENUM ('trainer', 'educator', 'fellow');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE credential_status AS ENUM ('active', 'warning', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE fsrs_state AS ENUM ('new', 'learning', 'review', 'relearning');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE subscription_plan AS ENUM ('monthly', 'annual', 'lifetime', 'team');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------
-- EMPLOYERS
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS employers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  seat_count    INTEGER NOT NULL DEFAULT 1,
  admin_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE employers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employers: admin reads own"   ON employers;
DROP POLICY IF EXISTS "employers: admin updates own" ON employers;

CREATE POLICY "employers: admin reads own"
  ON employers FOR SELECT USING (admin_user_id = auth.uid());

CREATE POLICY "employers: admin updates own"
  ON employers FOR UPDATE USING (admin_user_id = auth.uid());

-- ----------------------------------------------------------------
-- CARD_REVIEWS (FSRS v5 state — upsert on review)
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS card_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id        UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  due            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stability      REAL NOT NULL DEFAULT 0,
  difficulty     REAL NOT NULL DEFAULT 0,
  elapsed_days   INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  reps           INTEGER NOT NULL DEFAULT 0,
  lapses         INTEGER NOT NULL DEFAULT 0,
  state          fsrs_state NOT NULL DEFAULT 'new',
  last_review    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_card_reviews_due ON card_reviews (user_id, due);

ALTER TABLE card_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_reviews: user reads own"   ON card_reviews;
DROP POLICY IF EXISTS "card_reviews: user inserts own" ON card_reviews;
DROP POLICY IF EXISTS "card_reviews: user updates own" ON card_reviews;

CREATE POLICY "card_reviews: user reads own"
  ON card_reviews FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "card_reviews: user inserts own"
  ON card_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "card_reviews: user updates own"
  ON card_reviews FOR UPDATE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- CREDENTIALS
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_type credential_type NOT NULL,
  status          credential_status NOT NULL DEFAULT 'active',
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, credential_type)
);

ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credentials: user reads own" ON credentials;

CREATE POLICY "credentials: user reads own"
  ON credentials FOR SELECT USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- BADGES
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS badges (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_key)
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges: user reads own" ON badges;

CREATE POLICY "badges: user reads own"
  ON badges FOR SELECT USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- CE_MODULES
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ce_modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  credits     REAL NOT NULL DEFAULT 1.0,
  content_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ce_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ce_modules: authenticated read" ON ce_modules;

CREATE POLICY "ce_modules: authenticated read"
  ON ce_modules FOR SELECT USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- CE_COMPLETIONS
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ce_completions (
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

ALTER TABLE ce_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ce_completions: user reads own"   ON ce_completions;
DROP POLICY IF EXISTS "ce_completions: user inserts own" ON ce_completions;
DROP POLICY IF EXISTS "ce_completions: user updates own" ON ce_completions;

CREATE POLICY "ce_completions: user reads own"
  ON ce_completions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ce_completions: user inserts own"
  ON ce_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ce_completions: user updates own"
  ON ce_completions FOR UPDATE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- Reload PostgREST schema cache
-- ----------------------------------------------------------------

NOTIFY pgrst, 'reload schema';
