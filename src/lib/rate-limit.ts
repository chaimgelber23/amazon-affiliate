import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { pseudonymizeIp } from "./privacy";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: SupabaseClient<any, any, any> | null = null;

function getClient() {
    if (supabase) return supabase;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return supabase;
}

const DEFAULT_PER_MINUTE_LIMIT = 10;
const DEFAULT_DAILY_LIMIT = 500;
const INFRASTRUCTURE_RETRY_AFTER_SECONDS = 15;

function boundedInteger(
    value: string | undefined,
    fallback: number,
    minimum: number,
    maximum: number,
): number {
    const normalized = value?.trim();
    if (!normalized || !/^\d+$/.test(normalized)) return fallback;

    const parsed = Number(normalized);
    if (
        !Number.isSafeInteger(parsed) ||
        parsed < minimum ||
        parsed > maximum
    ) {
        return fallback;
    }
    return parsed;
}

export interface SearchBudgetResult {
    allowed: boolean;
    retryAfterSeconds: number;
    reason:
        | "ok"
        | "per_ip_minute"
        | "daily_budget"
        | "infrastructure_unavailable";
    shared: boolean;
}

function infrastructureUnavailable(): SearchBudgetResult {
    return {
        allowed: false,
        retryAfterSeconds: INFRASTRUCTURE_RETRY_AFTER_SECONDS,
        reason: "infrastructure_unavailable",
        shared: false,
    };
}

export async function takeSearchBudget(ip: string): Promise<SearchBudgetResult> {
    let ipHash: string | null;
    try {
        ipHash = pseudonymizeIp(ip);
    } catch (error) {
        console.warn(
            "[rate-limit] request key generation failed:",
            error instanceof Error ? error.message : "unknown error",
        );
        return infrastructureUnavailable();
    }
    if (!ipHash) {
        console.warn("[rate-limit] request key generation is unavailable");
        return infrastructureUnavailable();
    }

    let client: ReturnType<typeof getClient>;
    try {
        client = getClient();
    } catch (error) {
        console.warn(
            "[rate-limit] shared budget client failed:",
            error instanceof Error ? error.message : "unknown error",
        );
        return infrastructureUnavailable();
    }
    if (!client) {
        console.warn("[rate-limit] shared budget is not configured");
        return infrastructureUnavailable();
    }

    const perMinuteLimit = boundedInteger(
        process.env.PRODUCTFIND_SEARCHES_PER_MINUTE,
        DEFAULT_PER_MINUTE_LIMIT,
        1,
        100,
    );
    const dailyLimit = boundedInteger(
        process.env.PRODUCTFIND_DAILY_SEARCH_LIMIT,
        DEFAULT_DAILY_LIMIT,
        1,
        100_000,
    );

    let data: unknown;
    try {
        const result = await client.rpc("pf_take_search_budget", {
            p_ip_hash: ipHash,
            p_per_minute_limit: perMinuteLimit,
            p_daily_limit: dailyLimit,
        });
        if (result.error) {
            console.warn(
                "[rate-limit] shared budget failed:",
                result.error.message,
            );
            return infrastructureUnavailable();
        }
        data = result.data;
    } catch (error) {
        console.warn(
            "[rate-limit] shared budget request failed:",
            error instanceof Error ? error.message : "unknown error",
        );
        return infrastructureUnavailable();
    }

    if (Array.isArray(data) && data.length !== 1) {
        console.warn(
            "[rate-limit] shared budget returned an invalid row count",
        );
        return infrastructureUnavailable();
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object" || !("allowed" in row)) {
        console.warn("[rate-limit] shared budget returned an invalid response");
        return infrastructureUnavailable();
    }

    const budgetRow = row as {
        allowed?: unknown;
        reason?: unknown;
        retry_after_seconds?: unknown;
    };
    if (typeof budgetRow.allowed !== "boolean") {
        console.warn("[rate-limit] shared budget returned an invalid decision");
        return infrastructureUnavailable();
    }

    const validReason =
        (budgetRow.allowed && budgetRow.reason === "ok") ||
        (!budgetRow.allowed &&
            (budgetRow.reason === "per_ip_minute" ||
                budgetRow.reason === "daily_budget"));
    if (!validReason) {
        console.warn("[rate-limit] shared budget returned an invalid reason");
        return infrastructureUnavailable();
    }

    const retryAfter =
        typeof budgetRow.retry_after_seconds === "number"
            ? budgetRow.retry_after_seconds
            : Number.NaN;
    if (
        !Number.isSafeInteger(retryAfter) ||
        retryAfter < 0 ||
        retryAfter > 86_400 ||
        (budgetRow.allowed && retryAfter !== 0) ||
        (!budgetRow.allowed && retryAfter < 1)
    ) {
        console.warn(
            "[rate-limit] shared budget returned an invalid retry window",
        );
        return infrastructureUnavailable();
    }

    return {
        allowed: budgetRow.allowed,
        retryAfterSeconds: retryAfter,
        reason: budgetRow.reason as
            | "ok"
            | "per_ip_minute"
            | "daily_budget",
        shared: true,
    };
}

export async function reserveSharedApiSlot(
    leaseName: string,
    minimumIntervalMs: number,
    maximumWaitMs: number,
): Promise<number | null> {
    let client: ReturnType<typeof getClient>;
    try {
        client = getClient();
    } catch (error) {
        console.warn(
            "[rate-limit] shared API lease client failed:",
            error instanceof Error ? error.message : "unknown error",
        );
        return -1;
    }
    if (!client) {
        console.warn("[rate-limit] shared API lease is not configured");
        return -1;
    }

    try {
        const { data, error } = await client.rpc("pf_reserve_api_slot", {
            p_lease_name: leaseName,
            p_minimum_interval_ms: minimumIntervalMs,
            p_max_wait_ms: maximumWaitMs,
        });
        if (error) {
            console.warn(
                "[rate-limit] shared API lease failed:",
                error.message,
            );
            return -1;
        }

        return typeof data === "number" && Number.isFinite(data) ? data : -1;
    } catch (error) {
        console.warn(
            "[rate-limit] shared API lease request failed:",
            error instanceof Error ? error.message : "unknown error",
        );
        return -1;
    }
}
