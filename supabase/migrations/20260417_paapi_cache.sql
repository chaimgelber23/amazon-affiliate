-- ============================================
-- PureFind - Official Amazon Product API Response Cache
-- ============================================
-- Applied: 2026-04-17
--
-- Amazon official product APIs are quota-limited. Caching identical SearchItems
-- calls for up to 1 hour keeps us under throttle while respecting the freshness
-- window for price-bearing product content.
--
-- query_hash = sha256(lowercase(trim(query)) + "|" + searchIndex + "|" + itemCount)
--
-- Reads refuse rows older than 1 hour; the app also best-effort deletes stale
-- rows. This helper is kept for manual or scheduled cleanup.
-- ============================================

CREATE TABLE IF NOT EXISTS pf_paapi_cache (
  query_hash  TEXT PRIMARY KEY,
  query       TEXT NOT NULL,
  results     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_paapi_cache_created_at
  ON pf_paapi_cache (created_at);

-- RLS: this table is only written/read by the service role.
-- Anon/authenticated should never touch it directly.
ALTER TABLE pf_paapi_cache ENABLE ROW LEVEL SECURITY;

-- No policies = denied for non-service-role clients.
-- The API route uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.

-- Helper: one-shot eviction sweep.
CREATE OR REPLACE FUNCTION evict_stale_paapi_cache()
RETURNS INTEGER AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM pf_paapi_cache
   WHERE created_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
