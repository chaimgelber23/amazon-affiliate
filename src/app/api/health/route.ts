import { createClient } from "@supabase/supabase-js";
import { readCatalogObservation } from "@/lib/catalog-status";
import { hasAmazonProductApiConfiguration } from "@/lib/amazon-paapi";
import { getQueryPlannerConfiguration } from "@/lib/query-planner-config";

export const dynamic = "force-dynamic";
export const maxDuration = 5;

type CheckStatus = "ok" | "error" | "fallback" | "stale" | "unknown";
interface HealthResult {
    body: Record<string, unknown>;
    status: 200 | 503;
}

const HEALTH_CACHE_MS = 15_000;
const HEALTH_PROBE_TIMEOUT_MS = 2_500;
let cachedHealth: { result: HealthResult; expiresAt: number } | null = null;
let healthProbeInFlight: Promise<HealthResult> | null = null;

async function performHealthProbe(): Promise<HealthResult> {
    const checks: Record<string, CheckStatus> = {};
    const catalogObservationPromise = readCatalogObservation();

    // Check Supabase connectivity against ProductFindAI's own tables. The
    // previous deals-table check was from an older product shape and produced
    // false degraded health on the approval-facing app.
    const supaUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
    const supaKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
    if (supaUrl && supaKey) {
        try {
            const client = createClient(supaUrl, supaKey);
            const probeSignal = AbortSignal.timeout(HEALTH_PROBE_TIMEOUT_MS);
            const [tableProbe, contractProbe] = await Promise.all([
                client
                    .from("pf_search_logs")
                    .select("id")
                    .limit(1)
                    .abortSignal(probeSignal),
                client
                    .rpc("pf_productfind_healthcheck")
                    .abortSignal(probeSignal),
            ]);
            checks.supabase =
                !tableProbe.error &&
                !contractProbe.error &&
                contractProbe.data === true
                    ? "ok"
                    : "error";
        } catch {
            checks.supabase = "error";
        }
    } else {
        checks.supabase = "error";
    }

    const planner = getQueryPlannerConfiguration();
    checks.queryPlanner = planner.available ? "ok" : "fallback";

    // Configuration says only whether runtime can attempt the official API.
    // Operational catalog status is a separate passive last-observed signal.
    const amazonConfigured = hasAmazonProductApiConfiguration();
    checks.amazonConfiguration = amazonConfigured ? "ok" : "error";
    const catalogObservation = await catalogObservationPromise;
    checks.amazonCatalog =
        catalogObservation.status === "operational"
            ? "ok"
            : catalogObservation.status === "unavailable"
              ? "error"
              : catalogObservation.status;

    const allOk = Object.values(checks).every((value) => value === "ok");

    return {
        body: {
            status: allOk ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            checks,
            queryPlanner: {
                mode: planner.mode,
                available: planner.available,
            },
            amazon: {
                configured: amazonConfigured,
                catalog: catalogObservation,
            },
        },
        status: allOk ? 200 : 503,
    };
}

export async function GET() {
    const now = Date.now();
    if (cachedHealth && cachedHealth.expiresAt > now) {
        return Response.json(cachedHealth.result.body, {
            status: cachedHealth.result.status,
            headers: { "Cache-Control": "no-store" },
        });
    }

    if (!healthProbeInFlight) {
        healthProbeInFlight = performHealthProbe()
            .then((result) => {
                cachedHealth = {
                    result,
                    expiresAt: Date.now() + HEALTH_CACHE_MS,
                };
                return result;
            })
            .finally(() => {
                healthProbeInFlight = null;
            });
    }

    const result = await healthProbeInFlight;
    return Response.json(result.body, {
        status: result.status,
        headers: { "Cache-Control": "no-store" },
    });
}
