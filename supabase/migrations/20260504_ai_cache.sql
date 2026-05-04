-- ============================================
-- PureFind — AI Recommendation Cache
-- ============================================
-- Identical normalized queries shouldn't burn a fresh Gemini quota slot
-- every time. We cache the parsed AIResponse for 24h keyed on
-- sha256(lowercase(trim(query)) + "|v3"). PA-API enrichment still
-- re-runs against pf_paapi_cache (1h TTL), so prices stay reasonably
-- fresh even on cache hits.
--
-- Skipped on refinement queries — those are contextual to a prior list.
-- ============================================

CREATE TABLE IF NOT EXISTS pf_ai_cache (
  query_hash  TEXT PRIMARY KEY,
  query       TEXT NOT NULL,
  model       TEXT NOT NULL,
  response    JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_ai_cache_created_at
  ON pf_ai_cache (created_at);

ALTER TABLE pf_ai_cache ENABLE ROW LEVEL SECURITY;
-- Service-role-only by default (no policies = denied for anon/authenticated).

CREATE OR REPLACE FUNCTION evict_stale_ai_cache()
RETURNS INTEGER AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM pf_ai_cache
   WHERE created_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
