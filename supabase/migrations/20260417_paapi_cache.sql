-- ============================================
-- PureFind — PA-API Response Cache
-- ============================================
-- Applied: 2026-04-17
--
-- Amazon Product Advertising API 5.0 has tight throttling
-- (1 TPS default, scales with revenue). Caching identical
-- SearchItems calls for 24h keeps us under throttle during
-- traffic spikes and avoids duplicate billing events.
--
-- query_hash = sha256(lowercase(trim(query)) + "|" + searchIndex + "|" + itemCount)
--
-- Reads auto-evict rows older than 24h via the WHERE clause
-- in `getPaapiCache()`; a weekly cron sweep removes old rows.
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

-- Helper: one-shot eviction sweep (run weekly via cron).
CREATE OR REPLACE FUNCTION evict_stale_paapi_cache()
RETURNS INTEGER AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM pf_paapi_cache
   WHERE created_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
