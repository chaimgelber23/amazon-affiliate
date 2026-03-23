-- Run this in your Supabase SQL Editor to create the analytics tables.
-- These are used by the search API to log searches and errors.

-- Search analytics: tracks what people search for and how well enrichment works
CREATE TABLE IF NOT EXISTS search_logs (
    id          BIGSERIAL PRIMARY KEY,
    query       TEXT NOT NULL,
    ip_hash     TEXT,                          -- hashed IP for grouping, not PII
    result_count    INT DEFAULT 0,
    enriched_count  INT DEFAULT 0,             -- how many got real Amazon data
    duration_ms     INT DEFAULT 0,
    error       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent searches and popular queries
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs (query);

-- Error tracking: logs API errors for monitoring
CREATE TABLE IF NOT EXISTS error_logs (
    id          BIGSERIAL PRIMARY KEY,
    route       TEXT NOT NULL,
    error       TEXT NOT NULL,
    ip_hash     TEXT,
    extra       JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_route ON error_logs (route);

-- Enable RLS but allow service role to insert (your API uses service role key)
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON search_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON error_logs FOR ALL USING (true) WITH CHECK (true);

-- Optional: auto-delete logs older than 90 days (run as a Supabase cron or manually)
-- DELETE FROM search_logs WHERE created_at < NOW() - INTERVAL '90 days';
-- DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
