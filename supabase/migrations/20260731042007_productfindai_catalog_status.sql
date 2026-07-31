-- Stores one passive operational observation. It never stores a shopper
-- query, ASIN, Amazon Program Content, response payload, or credential detail.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE TABLE public.pf_service_status (
  service TEXT PRIMARY KEY
    CHECK (service IN ('amazon_catalog')),
  outcome TEXT NOT NULL
    CHECK (outcome IN ('success', 'failure')),
  operation TEXT NOT NULL
    CHECK (operation IN ('search-items', 'get-items')),
  http_status SMALLINT
    CHECK (http_status IS NULL OR http_status BETWEEN 100 AND 599),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pf_service_status ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES
  ON TABLE public.pf_service_status
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.pf_service_status
  TO service_role;

CREATE OR REPLACE FUNCTION public.pf_productfind_healthcheck()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT
    to_regclass('public.pf_ai_cache') IS NOT NULL
    AND to_regclass('public.pf_paapi_cache') IS NOT NULL
    AND to_regclass('public.pf_search_logs') IS NOT NULL
    AND to_regclass('public.pf_error_logs') IS NOT NULL
    AND to_regclass('public.pf_rate_limit_windows') IS NOT NULL
    AND to_regclass('public.pf_runtime_leases') IS NOT NULL
    AND to_regclass('public.pf_service_status') IS NOT NULL
    AND to_regprocedure(
      'public.pf_take_search_budget(text,integer,integer)'
    ) IS NOT NULL
    AND to_regprocedure(
      'public.pf_reserve_api_slot(text,integer,integer)'
    ) IS NOT NULL
    AND to_regprocedure(
      'public.pf_prune_operational_data()'
    ) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class AS relation
      JOIN pg_catalog.pg_namespace AS namespace
        ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = 'public'
        AND relation.relname = 'pf_service_status'
        AND relation.relrowsecurity = TRUE
    )
    AND has_table_privilege(
      'service_role',
      'public.pf_service_status',
      'SELECT'
    )
    AND has_table_privilege(
      'service_role',
      'public.pf_service_status',
      'INSERT'
    )
    AND has_table_privilege(
      'service_role',
      'public.pf_service_status',
      'UPDATE'
    )
    AND NOT has_table_privilege(
      'service_role',
      'public.pf_service_status',
      'DELETE'
    )
    AND NOT has_table_privilege(
      'anon',
      'public.pf_service_status',
      'SELECT'
    )
    AND NOT has_table_privilege(
      'anon',
      'public.pf_service_status',
      'INSERT'
    )
    AND NOT has_table_privilege(
      'anon',
      'public.pf_service_status',
      'UPDATE'
    )
    AND NOT has_table_privilege(
      'anon',
      'public.pf_service_status',
      'DELETE'
    )
    AND NOT has_table_privilege(
      'authenticated',
      'public.pf_service_status',
      'SELECT'
    )
    AND NOT has_table_privilege(
      'authenticated',
      'public.pf_service_status',
      'INSERT'
    )
    AND NOT has_table_privilege(
      'authenticated',
      'public.pf_service_status',
      'UPDATE'
    )
    AND NOT has_table_privilege(
      'authenticated',
      'public.pf_service_status',
      'DELETE'
    )
    AND has_function_privilege(
      'service_role',
      'public.pf_take_search_budget(text,integer,integer)',
      'EXECUTE'
    )
    AND has_function_privilege(
      'service_role',
      'public.pf_reserve_api_slot(text,integer,integer)',
      'EXECUTE'
    )
    AND has_function_privilege(
      'service_role',
      'public.pf_prune_operational_data()',
      'EXECUTE'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'pf_service_status'
    )
    AND (
      SELECT COUNT(*) = 1
      FROM cron.job
      WHERE jobname = 'productfindai-retention-cleanup'
        AND active IS TRUE
        AND schedule = '*/15 * * * *'
        AND btrim(command) =
          'SELECT public.pf_prune_operational_data();'
        AND database = current_database()
        AND username = current_user::TEXT
    );
$function$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.pf_productfind_healthcheck()
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE
  ON FUNCTION public.pf_productfind_healthcheck()
  TO service_role;
