-- Add client_nonce for idempotent offline review sync.
-- Partial unique index allows existing rows (null nonce) to coexist.
ALTER TABLE review_log ADD COLUMN IF NOT EXISTS client_nonce uuid;

CREATE UNIQUE INDEX IF NOT EXISTS review_log_client_nonce_idx
  ON review_log (client_nonce)
  WHERE client_nonce IS NOT NULL;
