import { createClient, SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: SupabaseClient<any, any, any> | null = null;

function getClient() {
    if (supabase) return supabase;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    supabase = createClient(url, key);
    return supabase;
}

/**
 * Log a search event to Supabase. Fire-and-forget — never blocks or throws.
 */
export function logSearch(data: {
    query: string;
    ip: string;
    resultCount: number;
    enrichedCount: number;
    durationMs: number;
    error?: string;
}) {
    const client = getClient();
    if (!client) return;

    // Fire and forget — don't await, don't block the response
    client
        .from("pf_search_logs")
        .insert({
            query: data.query.slice(0, 500),
            ip_hash: hashIp(data.ip),
            result_count: data.resultCount,
            enriched_count: data.enrichedCount,
            duration_ms: data.durationMs,
            error: data.error?.slice(0, 500) ?? null,
            created_at: new Date().toISOString(),
        })
        .then(({ error }) => {
            if (error) console.warn("[analytics] insert failed:", error.message);
        });
}

/**
 * Log an error event. Fire-and-forget.
 */
export function logError(data: {
    route: string;
    error: string;
    ip?: string;
    extra?: Record<string, unknown>;
}) {
    const client = getClient();
    if (!client) return;

    client
        .from("pf_error_logs")
        .insert({
            route: data.route,
            error: data.error.slice(0, 2000),
            ip_hash: data.ip ? hashIp(data.ip) : null,
            extra: data.extra ?? null,
            created_at: new Date().toISOString(),
        })
        .then(({ error }) => {
            if (error) console.warn("[error_log] insert failed:", error.message);
        });
}

/**
 * Simple hash for IP addresses — we don't store raw IPs for privacy.
 * Uses a basic FNV-1a hash, good enough for grouping without PII.
 */
function hashIp(ip: string): string {
    let hash = 2166136261;
    for (let i = 0; i < ip.length; i++) {
        hash ^= ip.charCodeAt(i);
        hash = (hash * 16777619) >>> 0;
    }
    return hash.toString(36);
}
