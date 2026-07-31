import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
    pseudonymizeIp,
    sanitizeLogExtra,
    sanitizeLogText,
} from "./privacy";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: SupabaseClient<any, any, any> | null = null;

function getClient() {
    if (supabase) return supabase;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    try {
        supabase = createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        return supabase;
    } catch (error) {
        console.warn(
            "[analytics] database client is unavailable:",
            error instanceof Error
                ? sanitizeLogText(error.message, 200)
                : "unknown error",
        );
        return null;
    }
}

let lastPruneAt = 0;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;
const ANALYTICS_IO_TIMEOUT_MS = 1_500;
let pruneInFlight: Promise<boolean> | null = null;

async function ensureRetentionPruned(
    client: NonNullable<ReturnType<typeof getClient>>,
): Promise<boolean> {
    if (Date.now() - lastPruneAt < PRUNE_INTERVAL_MS) return true;
    if (pruneInFlight) return pruneInFlight;

    pruneInFlight = (async () => {
        try {
            const { error } = await client
                .rpc("pf_prune_operational_data")
                .abortSignal(AbortSignal.timeout(ANALYTICS_IO_TIMEOUT_MS));
            if (error) {
                console.warn(
                    "[analytics] retention cleanup failed:",
                    sanitizeLogText(error.message, 200),
                );
                return false;
            }
            lastPruneAt = Date.now();
            return true;
        } catch (error) {
            console.warn(
                "[analytics] retention cleanup request failed:",
                error instanceof Error
                    ? sanitizeLogText(error.message, 200)
                    : "unknown error",
            );
            return false;
        } finally {
            pruneInFlight = null;
        }
    })();

    return pruneInFlight;
}

/**
 * Log a search event without blocking the search response. Retention cleanup
 * is awaited before the insert; if cleanup is unavailable, the new log is
 * skipped instead of adding more operational data.
 */
export async function logSearch(data: {
    query: string;
    ip: string;
    resultCount: number;
    enrichedCount: number;
    durationMs: number;
    error?: string;
}): Promise<void> {
    const client = getClient();
    if (!client) return;
    try {
        if (!(await ensureRetentionPruned(client))) {
            console.warn(
                "[analytics] insert skipped while retention cleanup is unavailable",
            );
            return;
        }

        const { error } = await client
            .from("pf_search_logs")
            .insert({
                query: sanitizeLogText(data.query, 500),
                ip_hash: pseudonymizeIp(data.ip),
                result_count: data.resultCount,
                enriched_count: data.enrichedCount,
                duration_ms: data.durationMs,
                error: data.error
                    ? sanitizeLogText(data.error, 500)
                    : null,
                created_at: new Date().toISOString(),
            })
            .abortSignal(AbortSignal.timeout(ANALYTICS_IO_TIMEOUT_MS));
        if (error) {
            console.warn(
                "[analytics] insert failed:",
                sanitizeLogText(error.message, 200),
            );
        }
    } catch (error) {
        console.warn(
            "[analytics] write failed:",
            error instanceof Error
                ? sanitizeLogText(error.message, 200)
                : "unknown error",
        );
    }
}

/**
 * Log an error event without blocking the response. The same retention gate
 * applies as search logs.
 */
export async function logError(data: {
    route: string;
    error: string;
    ip?: string;
    extra?: Record<string, unknown>;
}): Promise<void> {
    const client = getClient();
    if (!client) return;
    try {
        if (!(await ensureRetentionPruned(client))) {
            console.warn(
                "[error_log] insert skipped while retention cleanup is unavailable",
            );
            return;
        }

        const { error } = await client
            .from("pf_error_logs")
            .insert({
                route: sanitizeLogText(data.route, 200),
                error: sanitizeLogText(data.error, 2000),
                ip_hash: data.ip ? pseudonymizeIp(data.ip) : null,
                extra: sanitizeLogExtra(data.extra),
                created_at: new Date().toISOString(),
            })
            .abortSignal(AbortSignal.timeout(ANALYTICS_IO_TIMEOUT_MS));
        if (error) {
            console.warn(
                "[error_log] insert failed:",
                sanitizeLogText(error.message, 200),
            );
        }
    } catch (error) {
        console.warn(
            "[error_log] write failed:",
            error instanceof Error
                ? sanitizeLogText(error.message, 200)
                : "unknown error",
        );
    }
}
