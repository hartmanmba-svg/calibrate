-- ============================================================
-- RPC: upsert_share_link
-- Upserts a share_link row for the given user and returns it.
-- Used instead of direct INSERT to avoid PostgREST schema cache
-- issues (PGRST205) on fresh table deployments.
-- ============================================================

CREATE OR REPLACE FUNCTION upsert_share_link(p_user_id UUID)
RETURNS TABLE(token TEXT, show_name BOOLEAN, show_scores BOOLEAN, show_credentials BOOLEAN, show_badges BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO share_links (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY
  SELECT sl.token, sl.show_name, sl.show_scores, sl.show_credentials, sl.show_badges
  FROM share_links sl
  WHERE sl.user_id = p_user_id;
END;
$$;
