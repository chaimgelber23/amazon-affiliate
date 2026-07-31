import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type CatalogOperation = "search-items" | "get-items";
export type CatalogOutcome = "success" | "failure";
export type CatalogOperationalStatus =
    | "operational"
    | "unavailable"
    | "stale"
    | "unknown";

export interface CatalogObservation {
    status: CatalogOperationalStatus;
    lastOutcome: CatalogOutcome | null;
    observedAt: string | null;
    stale: boolean | null;
    ageSeconds: number | null;
    staleAfterSeconds: number;
    source: "passive-catalog-status";
}

export interface CatalogFailureRecordingContext {
    error: unknown;
    catalogRequestStarted: boolean;
    catalogFailureObserved: boolean;
    requestCancelled: boolean;
}

const CATALOG_STATUS_SERVICE = "amazon_catalog";
const CATALOG_STATUS_WRITE_TIMEOUT_MS = 1_500;
const CATALOG_STATUS_READ_TIMEOUT_MS = 2_000;
export const CATALOG_STATUS_STALE_AFTER_MS = 65 * 60 * 1_000;

function catalogFailureSignals(error: unknown): string {
    if (error === null || error === undefined) return "";
    if (typeof error === "string" || typeof error === "number") {
        return String(error);
    }
    if (typeof error !== "object") return "";
    const record = error as Record<string, unknown>;
    return ["name", "message", "status", "statusCode", "reason"]
        .map((key) => record[key])
        .filter(
            (value): value is string | number =>
                typeof value === "string" || typeof value === "number",
        )
        .map(String)
        .join(" ");
}

export function shouldRecordCatalogFailure(
    context: CatalogFailureRecordingContext,
): boolean {
    if (context.catalogFailureObserved) return true;

    const signal = catalogFailureSignals(context.error);
    const localPressure =
        /\b(?:queue is full|shared request queue|local queue|shopper cancelled|client cancelled)\b/i.test(
            signal,
        );
    if (localPressure && !context.catalogFailureObserved) return false;

    const accessFailure =
        /(?:^|\D)(?:401|403)(?:\D|$)/.test(signal) ||
        /\b(?:AssociateNotEligible|unauthori[sz]ed|forbidden|authentication|authorization|access\s+denied|not\s+eligible)\b/i.test(
            signal,
        ) ||
        /\bCreators\s+API\s+token\b.*\b(?:failed\s+\((?:401|403)\)|did\s+not\s+include)\b/i.test(
            signal,
        );
    if (accessFailure) return true;

    // A non-cancelled failure anywhere in the official access path (including
    // token acquisition, provider timeout, or catalog request) means shoppers
    // cannot currently receive verified results. Keep local queue pressure and
    // shopper cancellation out of the provider signal above.
    return !context.requestCancelled;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let catalogStatusClient: SupabaseClient<any, any, any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCatalogStatusClient(): SupabaseClient<any, any, any> | null {
    if (catalogStatusClient) return catalogStatusClient;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) return null;
    catalogStatusClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return catalogStatusClient;
}

function normalizedHttpStatus(value: number | undefined): number | null {
    return Number.isInteger(value) && value! >= 100 && value! <= 599
        ? value!
        : null;
}

export async function recordCatalogOutcome(input: {
    outcome: CatalogOutcome;
    operation: CatalogOperation;
    httpStatus?: number;
}): Promise<boolean> {
    const client = getCatalogStatusClient();
    if (!client) return false;

    try {
        const observedAt = new Date().toISOString();
        const { error } = await client
            .from("pf_service_status")
            .upsert(
                {
                    service: CATALOG_STATUS_SERVICE,
                    outcome: input.outcome,
                    operation: input.operation,
                    http_status: normalizedHttpStatus(input.httpStatus),
                    observed_at: observedAt,
                },
                { onConflict: "service" },
            )
            .abortSignal(
                AbortSignal.timeout(CATALOG_STATUS_WRITE_TIMEOUT_MS),
            );
        if (error) {
            console.warn("[catalog-status] write unavailable");
            return false;
        }
        return true;
    } catch {
        console.warn("[catalog-status] write unavailable");
        return false;
    }
}

export async function readCatalogObservation(): Promise<CatalogObservation> {
    const unknown: CatalogObservation = {
        status: "unknown",
        lastOutcome: null,
        observedAt: null,
        stale: null,
        ageSeconds: null,
        staleAfterSeconds: CATALOG_STATUS_STALE_AFTER_MS / 1_000,
        source: "passive-catalog-status",
    };
    const client = getCatalogStatusClient();
    if (!client) return unknown;

    try {
        const { data, error } = await client
            .from("pf_service_status")
            .select("outcome, observed_at")
            .eq("service", CATALOG_STATUS_SERVICE)
            .abortSignal(
                AbortSignal.timeout(CATALOG_STATUS_READ_TIMEOUT_MS),
            )
            .maybeSingle();
        if (error || !data) return unknown;

        const outcome =
            data.outcome === "success" || data.outcome === "failure"
                ? data.outcome
                : null;
        const observedAt =
            typeof data.observed_at === "string"
                ? data.observed_at
                : null;
        const observedTime = observedAt ? Date.parse(observedAt) : Number.NaN;
        if (!outcome || !Number.isFinite(observedTime)) return unknown;

        const ageMs = Math.max(0, Date.now() - observedTime);
        const stale = ageMs > CATALOG_STATUS_STALE_AFTER_MS;
        return {
            status: stale
                ? "stale"
                : outcome === "success"
                  ? "operational"
                  : "unavailable",
            lastOutcome: outcome,
            observedAt,
            stale,
            ageSeconds: Math.floor(ageMs / 1_000),
            staleAfterSeconds: CATALOG_STATUS_STALE_AFTER_MS / 1_000,
            source: "passive-catalog-status",
        };
    } catch {
        return unknown;
    }
}
