-- Align existing ProductFindAI Amazon product API cache cleanup with the
-- current 1-hour freshness posture for price-bearing product content.

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
