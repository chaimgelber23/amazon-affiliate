-- ============================================================================
-- PureFind tables for shared seo-business Supabase
-- Run this ONCE in Supabase SQL Editor: https://supabase.com/dashboard/project/trakxowvjsosbzbbfoxq/sql
-- ============================================================================

-- External deals aggregated from deal sites
CREATE TABLE IF NOT EXISTS pf_external_deals (
  asin TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amazon_url TEXT NOT NULL,
  source TEXT NOT NULL,
  sources TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'live',
  price TEXT,
  image_url TEXT,
  description TEXT,
  original_deal_url TEXT,
  posted_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pf_deals_status ON pf_external_deals(status);
CREATE INDEX IF NOT EXISTS idx_pf_deals_posted ON pf_external_deals(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pf_deals_source ON pf_external_deals(source);

ALTER TABLE pf_external_deals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "service_all_pf_deals" ON pf_external_deals FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Search analytics
CREATE TABLE IF NOT EXISTS pf_search_logs (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  ip_hash TEXT,
  result_count INT DEFAULT 0,
  enriched_count INT DEFAULT 0,
  duration_ms INT DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_search_created ON pf_search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pf_search_query ON pf_search_logs(query);

ALTER TABLE pf_search_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "service_all_pf_search" ON pf_search_logs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Error logs
CREATE TABLE IF NOT EXISTS pf_error_logs (
  id BIGSERIAL PRIMARY KEY,
  route TEXT NOT NULL,
  error TEXT NOT NULL,
  ip_hash TEXT,
  extra JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_errors_created ON pf_error_logs(created_at DESC);

ALTER TABLE pf_error_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "service_all_pf_errors" ON pf_error_logs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RPC: append a source to deal's sources array without duplicates
CREATE OR REPLACE FUNCTION pf_append_deal_source(p_asin TEXT, p_source TEXT)
RETURNS void AS $$
BEGIN
  UPDATE pf_external_deals
  SET sources = array_append(sources, p_source),
      last_seen_at = now()
  WHERE asin = p_asin
    AND NOT (p_source = ANY(sources));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DONE! 3 tables, 5 indexes, 3 RLS policies, 1 RPC function.
-- ============================================================================
