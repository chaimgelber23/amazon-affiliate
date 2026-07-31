import { generateText, gateway } from "ai";
import { google } from "@ai-sdk/google";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { after, NextRequest } from "next/server";
import {
    getAmazonItems,
    searchAmazon,
    type AmazonProduct,
} from "@/lib/amazon-paapi";
import { logSearch, logError } from "@/lib/analytics";
import {
    PRODUCT_BADGE_LABELS,
    PRODUCT_BADGE_SCOPE,
    type ProductBadge,
} from "@/lib/product-badges";
import { getQueryPlannerConfiguration } from "@/lib/query-planner-config";
import { takeSearchBudget } from "@/lib/rate-limit";
import {
    combineSearchIntent,
    collectSuccessfulPhraseSets,
    compareDeterministicListingIdentity,
    evaluateListingConstraints,
    explicitlyRequiresNewCondition,
    extractPriceCeiling,
    extractRequestedAsins,
    fitsPriceCeiling,
    isAmazonAccessUnavailableError,
    isFatalAmazonSearchError,
    parseOfficialPrice,
    provesRequestedProductIdentity,
    type ConstraintDecision,
    violatesPestProductSpecificity as violatesPestProductSpecificityCore,
} from "@/lib/search-core";
import {
    buildAffiliateSearchUrl,
    buildAffiliateUrl,
} from "@/lib/affiliate";

type SearchLogInput = Parameters<typeof logSearch>[0];
type ErrorLogInput = Parameters<typeof logError>[0];

function scheduleSearchLog(data: SearchLogInput): void {
    after(() => logSearch(data));
}

function scheduleErrorLog(data: ErrorLogInput): void {
    after(() => logError(data));
}

type RejectedSearchCode =
    | "RATE_LIMITED"
    | "DAILY_CAPACITY_REACHED"
    | "CAPACITY_CHECK_UNAVAILABLE";

// Rejected traffic must not turn the load-shedding path into one database
// write per abusive request. Keep only a bounded operational sample per
// outcome and server instance; the shared budget tables remain the source of
// truth for enforcement.
const REJECTION_LOG_SAMPLE_INTERVAL_MS = 5 * 60 * 1_000;
const lastRejectedLogAt: Partial<Record<RejectedSearchCode, number>> = {};

function scheduleRejectedSearchLog(
    code: RejectedSearchCode,
    data: Omit<SearchLogInput, "error" | "query">,
): void {
    const now = Date.now();
    const previous = lastRejectedLogAt[code] ?? 0;
    if (now - previous < REJECTION_LOG_SAMPLE_INTERVAL_MS) return;
    lastRejectedLogAt[code] = now;
    scheduleSearchLog({
        ...data,
        query: "[rejected request sample]",
        error: code,
    });
}

// Official Amazon lookups are serialized against the account-wide request
// budget. Keep enough headroom to return JSON before Vercel's hard deadline.
export const maxDuration = 60;

// Direct Gemini 2.5 Flash-Lite is the reliable low-cost default. Gemini 3.1
// Flash-Lite can be enabled through a funded Vercel AI Gateway account. Either
// model sees only the shopper's words; Amazon Program Content is never sent to
// an AI provider. Filtering and ranking remain deterministic.
const QUERY_PLANNER_GATEWAY_MODEL = "google/gemini-3.1-flash-lite";
const QUERY_PLANNER_DIRECT_MODEL = "gemini-2.5-flash-lite";

// Server-side AI response cache TTL. Identical normalized query -> same picks
// for 24h. Saves Gemini quota; official Amazon enrichment still re-runs or
// uses only its 1-hour server cache.
const AI_CACHE_TTL_HOURS = 24;

// The search endpoint is public but same-origin only. The Chrome extension is
// policy-blocked, so cross-origin access would add abuse surface without a
// currently approved product use case. The historical constant name is kept
// to avoid duplicating response metadata across every exit path.
const CORS = {
    "Cache-Control": "no-store",
};

const MAX_REQUEST_BYTES = 16_384;
const MAX_QUERY_CHARACTERS = 500;
const MAX_REFINEMENT_CONTEXT_CHARACTERS = 2_000;
const SEARCH_DEADLINE_MS = 54_000;
const MAX_SHORTLIST_RESULTS = 8;
const MAX_OFFICIAL_SEARCHES = 3;
const AMAZON_RESULTS_PER_SEARCH = 10;
const MAX_OFFICIAL_CANDIDATES = 30;

interface SearchContext {
    signal: AbortSignal;
    deadlineAt: number;
}

function remainingSearchTimeMs(
    context: SearchContext,
    maximumMs: number,
): number {
    if (context.signal.aborted) {
        throw context.signal.reason ??
            new DOMException("Search request was cancelled", "AbortError");
    }
    const remaining = context.deadlineAt - Date.now();
    if (remaining <= 0) {
        throw new DOMException("Search deadline exceeded", "TimeoutError");
    }
    return Math.max(1, Math.min(maximumMs, remaining));
}

function searchOperationSignal(
    context: SearchContext,
    maximumMs: number,
): AbortSignal {
    return AbortSignal.any([
        context.signal,
        AbortSignal.timeout(remainingSearchTimeMs(context, maximumMs)),
    ]);
}

async function raceWithSearchDeadline<T>(
    operation: PromiseLike<T>,
    context: SearchContext,
): Promise<T> {
    if (context.signal.aborted) {
        throw context.signal.reason ??
            new DOMException("Search request was cancelled", "AbortError");
    }
    return new Promise<T>((resolve, reject) => {
        const onAbort = () =>
            reject(
                context.signal.reason ??
                    new DOMException(
                        "Search request was cancelled",
                        "AbortError",
                    ),
            );
        context.signal.addEventListener("abort", onAbort, { once: true });
        Promise.resolve(operation).then(
            (value) => {
                context.signal.removeEventListener("abort", onAbort);
                resolve(value);
            },
            (error) => {
                context.signal.removeEventListener("abort", onAbort);
                reject(error);
            },
        );
    });
}

function isSearchDeadlineError(error: unknown): boolean {
    if (!(error instanceof Error || error instanceof DOMException)) {
        return false;
    }
    return (
        error.name === "AbortError" ||
        error.name === "TimeoutError" ||
        /aborted|cancelled|deadline|timed?\s*out/i.test(error.message)
    );
}

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS });
}

// Simple in-memory rate limiter (per warm serverless instance)
// Limits each IP to 10 searches per minute
const ipRequests = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (ipRequests.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) return true;
    recent.push(now);
    ipRequests.set(ip, recent);
    // Prevent unbounded growth
    if (ipRequests.size > 5000) {
        for (const [key, times] of ipRequests) {
            if (times.every(t => now - t >= WINDOW_MS)) ipRequests.delete(key);
        }
    }
    return false;
}

// Server-side query-plan cache.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _aiCacheClient: SupabaseClient<any, any, any> | null = null;
function getAiCacheClient() {
    if (_aiCacheClient) return _aiCacheClient;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    _aiCacheClient = createClient(url, key);
    return _aiCacheClient;
}

function normalizeQueryForCache(q: string): string {
    return q.toLowerCase().trim().replace(/\s+/g, " ").slice(0, 500);
}

interface QueryPlan {
    amazonQueries: string[];
    model: string;
    cached: boolean;
    inputTokens: number;
    outputTokens: number;
}

interface CachedQueryPlan {
    amazonQueries: string[];
}

interface PriorProduct {
    asin: string;
    title: string;
}

function queryPlanCacheKey(query: string): string {
    return crypto
        .createHash("sha256")
        .update(`query-plan-v1|${normalizeQueryForCache(query)}`)
        .digest("hex");
}

function cleanPlannedQueries(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const queries: string[] = [];
    const seen = new Set<string>();
    for (const item of value) {
        if (typeof item !== "string") continue;
        const cleaned = item
            .replace(/[\u0000-\u001F\u007F]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 160);
        const key = cleaned.toLowerCase();
        if (cleaned.length < 3 || seen.has(key)) continue;
        seen.add(key);
        queries.push(cleaned);
        if (queries.length >= 3) break;
    }
    return queries;
}

async function getCachedQueryPlan(
    query: string,
    context: SearchContext,
): Promise<QueryPlan | null> {
    const sb = getAiCacheClient();
    if (!sb) return null;
    try {
        const cutoff = new Date(
            Date.now() - AI_CACHE_TTL_HOURS * 60 * 60 * 1000,
        ).toISOString();
        const { data, error } = await raceWithSearchDeadline(
            sb
                .from("pf_ai_cache")
                .select("response, model")
                .eq("query_hash", queryPlanCacheKey(query))
                .gte("created_at", cutoff)
                .maybeSingle(),
            {
                signal: searchOperationSignal(context, 4_000),
                deadlineAt: context.deadlineAt,
            },
        );
        if (error || !data) return null;

        const response = data.response as CachedQueryPlan;
        const amazonQueries = cleanPlannedQueries(response?.amazonQueries);
        if (amazonQueries.length === 0) return null;
        return {
            amazonQueries,
            model:
                typeof data.model === "string" && data.model
                    ? data.model
                    : QUERY_PLANNER_GATEWAY_MODEL,
            cached: true,
            inputTokens: 0,
            outputTokens: 0,
        };
    } catch (error) {
        if (
            context.signal.aborted ||
            context.deadlineAt <= Date.now()
        ) {
            throw error;
        }
        console.warn("[query-plan-cache] read skipped");
        return null;
    }
}

async function setCachedQueryPlan(
    query: string,
    model: string,
    amazonQueries: string[],
    context: SearchContext,
): Promise<void> {
    const sb = getAiCacheClient();
    if (!sb || amazonQueries.length === 0) return;
    await raceWithSearchDeadline(
        sb
            .from("pf_ai_cache")
            .upsert(
                {
                    query_hash: queryPlanCacheKey(query),
                    query: `plan:${normalizeQueryForCache(query)}`.slice(0, 500),
                    model,
                    response: { amazonQueries },
                    created_at: new Date().toISOString(),
                },
                { onConflict: "query_hash" },
            ),
        {
            signal: searchOperationSignal(context, 4_000),
            deadlineAt: context.deadlineAt,
        },
    ).then(({ error }) => {
            if (error) {
                console.warn("[query-plan-cache] upsert failed:", error.message);
            }
        });
}

async function buildQueryPlan(
    query: string,
    context: SearchContext,
): Promise<QueryPlan> {
    const cached = await getCachedQueryPlan(query, context);
    if (cached) return cached;

    const {
        gatewayAvailable,
        directGoogleAvailable,
    } = getQueryPlannerConfiguration();
    try {
        const system = `You translate a shopper's plain-English request into focused Amazon catalog search phrases.

Return only JSON with this shape:
{"amazonQueries":["query one","query two","query three"]}

Rules:
- Preserve the product type and every hard requirement.
- Correct obvious spelling mistakes.
- Use 2 or 3 concise keyword phrases, each at most 12 words.
- Do not invent a brand, model, certification, or feature the shopper did not request.
- Convert "no numpad" to "tenkeyless TKL".
- Convert "works without internet" to "no WiFi remote control".
- Do not include a price ceiling in the search phrases; price is checked separately.
- Do not include commentary or markdown.`;
        const messages = [{ role: "user" as const, content: query }];
        let usedGateway = false;
        let result;

        if (gatewayAvailable) {
            try {
                result = await generateText({
                    model: gateway(QUERY_PLANNER_GATEWAY_MODEL),
                    system,
                    messages,
                    providerOptions: {
                        google: {
                            thinkingConfig: { thinkingLevel: "low" },
                        },
                        gateway: {
                            tags: ["productfindai", "query-planning"],
                        },
                    },
                    abortSignal: searchOperationSignal(context, 5_000),
                    maxOutputTokens: 160,
                    temperature: 0.1,
                });
                usedGateway = true;
            } catch (gatewayError) {
                if (!directGoogleAvailable) throw gatewayError;
                console.warn(
                    "[search] gateway query planner unavailable; trying direct Gemini:",
                    gatewayError instanceof Error
                        ? gatewayError.message
                        : gatewayError,
                );
            }
        }

        if (!result) {
            result = await generateText({
                model: google(QUERY_PLANNER_DIRECT_MODEL),
                system,
                messages,
                providerOptions: {
                    google: {
                        thinkingConfig: { thinkingBudget: 0 },
                    },
                },
                abortSignal: searchOperationSignal(context, 7_000),
                maxOutputTokens: 160,
                temperature: 0.1,
            });
        }

        const cleaned = result.text
            .replace(/```json\n?/gi, "")
            .replace(/```\n?/g, "")
            .trim();
        const parsed = JSON.parse(cleaned) as CachedQueryPlan;
        const amazonQueries = cleanPlannedQueries(parsed.amazonQueries);
        if (amazonQueries.length === 0) {
            throw new Error("query planner returned no usable search phrases");
        }

        const model =
            result.response.modelId ||
            (usedGateway
                ? QUERY_PLANNER_GATEWAY_MODEL
                : QUERY_PLANNER_DIRECT_MODEL);
        setCachedQueryPlan(query, model, amazonQueries, context).catch(
            () => {},
        );
        return {
            amazonQueries,
            model,
            cached: false,
            inputTokens: result.usage.inputTokens ?? 0,
            outputTokens: result.usage.outputTokens ?? 0,
        };
    } catch (error) {
        if (
            context.signal.aborted ||
            context.deadlineAt <= Date.now()
        ) {
            throw error;
        }
        console.warn(
            "[search] query planner unavailable; using deterministic phrases:",
            error instanceof Error ? error.message : error,
        );
        return {
            amazonQueries: [],
            model: "deterministic-query-plan",
            cached: false,
            inputTokens: 0,
            outputTokens: 0,
        };
    }
}

// ── Post-enrichment verification ─────────────────────────────────────────────
// Amazon owns listing identity, price, image, and features. AI only plans
// catalog search phrases; verified candidates are filtered and ranked locally.

interface EnrichedProductRow {
    rank: number;
    title: string;
    asin: string;
    parentAsin?: string;
    brand?: string;
    whyThisPick: string;
    pros: string[];
    cons: string[];
    priceEstimate: string;
    rating: number;
    category: string;
    imageUrl?: string;
    amazonUrl?: string;
    fetchedAt?: string;
    reviewCount?: number;
    features?: string[];
    condition?: string;
    subCondition?: string;
    color?: string;
    size?: string;
    unitCount?: number;
    productGroup?: string;
    verified: boolean;
    tier?: "budget" | "mid" | "premium";
    confidence?: "high" | "medium" | "low";
    constraintEvidence?: ConstraintDecision[];
    unknownConstraints?: string[];
}

type ListingConditionKey =
    | "new"
    | "renewed"
    | "refurbished"
    | "used"
    | "open-box"
    | "pre-owned"
    | "unknown";

const NON_NEW_CONDITION_ALIASES: Array<{
    key: Exclude<ListingConditionKey, "new" | "unknown">;
    pattern: RegExp;
}> = [
    { key: "renewed", pattern: /\brenewed\b/ },
    { key: "refurbished", pattern: /\brefurbished\b/ },
    { key: "used", pattern: /\bused\b/ },
    { key: "open-box", pattern: /\bopen\s+box\b/ },
    { key: "pre-owned", pattern: /\bpre\s+owned\b/ },
];
const ACCESSORY_MARKERS = [
    "adapter",
    "cable",
    "case",
    "charger",
    "cover",
    "frame",
    "keycaps",
    "mount",
    "shell",
    "stand",
    "switches",
];
const VARIANT_COLOR_WORDS = new Set([
    "beige",
    "black",
    "blue",
    "brown",
    "gold",
    "gray",
    "green",
    "grey",
    "orange",
    "pink",
    "purple",
    "red",
    "silver",
    "taupe",
    "white",
    "yellow",
]);

function normalizedWords(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function requestedNonNewConditions(
    query: string,
): Set<Exclude<ListingConditionKey, "new" | "unknown">> {
    const normalizedQuery = normalizedWords(query);
    const requested = new Set<
        Exclude<ListingConditionKey, "new" | "unknown">
    >();
    for (const { key, pattern } of NON_NEW_CONDITION_ALIASES) {
        if (!pattern.test(normalizedQuery)) continue;
        const source = pattern.source.replace(/^\\b|\\b$/g, "");
        const negatedBefore = new RegExp(
            `\\b(?:not|no|without|exclude|excludes|excluded|excluding|avoid|avoiding)\\b(?:\\s+[a-z0-9]+){0,5}\\s+(?:${source})\\b`,
        );
        const negatedAfter = new RegExp(
            `(?:${source})\\b(?:\\s+[a-z0-9]+){0,3}\\s+(?:excluded|unwanted|not\\s+allowed)\\b`,
        );
        if (
            negatedBefore.test(normalizedQuery) ||
            negatedAfter.test(normalizedQuery)
        ) {
            continue;
        }
        if (
            key === "used" &&
            /\bused\s+(?:for|to|by|as|with)\b/.test(normalizedQuery)
        ) {
            continue;
        }
        requested.add(key);
    }
    return requested;
}

function explicitlyRejectsNonNewCondition(query: string): boolean {
    const normalizedQuery = normalizedWords(query);
    return NON_NEW_CONDITION_ALIASES.some(({ key, pattern }) => {
        const source = pattern.source.replace(/^\\b|\\b$/g, "");
        const negatedBefore = new RegExp(
            `\\b(?:not|no|without|exclude|excludes|excluded|excluding|avoid|avoiding)\\b(?:\\s+[a-z0-9]+){0,5}\\s+(?:${source})\\b`,
        );
        const negatedAfter = new RegExp(
            `(?:${source})\\b(?:\\s+[a-z0-9]+){0,3}\\s+(?:excluded|unwanted|not\\s+allowed)\\b`,
        );
        if (
            key === "used" &&
            /\b(?:not|no|without)\s+used\s+(?:for|to|by|as|with)\b/.test(
                normalizedQuery,
            )
        ) {
            return false;
        }
        return (
            negatedBefore.test(normalizedQuery) ||
            negatedAfter.test(normalizedQuery)
        );
    });
}

function officialConditionKey(
    condition: string | undefined,
    subCondition: string | undefined,
): ListingConditionKey | null {
    const normalizedCondition = normalizedWords(condition ?? "");
    const normalizedSubCondition = normalizedWords(subCondition ?? "");
    if (/\bopen\s*box\b/.test(normalizedSubCondition)) return "open-box";
    if (/\brefurbished\b/.test(normalizedSubCondition)) return "refurbished";
    if (/\bpre\s*owned\b/.test(normalizedSubCondition)) return "pre-owned";
    if (/\bused\b/.test(normalizedCondition)) return "used";
    if (/\brefurbished\b/.test(normalizedCondition)) return "refurbished";
    if (/\brenewed\b/.test(normalizedCondition)) return "renewed";
    if (/\bnew\b/.test(normalizedCondition)) return "new";
    if (normalizedCondition || normalizedSubCondition) return "unknown";
    return null;
}

function conditionIsExplicitlyAllowed(
    condition: Exclude<ListingConditionKey, "new" | "unknown">,
    requested: Set<Exclude<ListingConditionKey, "new" | "unknown">>,
): boolean {
    if (requested.has(condition)) return true;
    if (
        condition === "used" &&
        (
            requested.has("open-box") ||
            requested.has("pre-owned")
        )
    ) {
        return true;
    }
    if (
        (condition === "renewed" || condition === "refurbished") &&
        (requested.has("renewed") || requested.has("refurbished"))
    ) {
        return true;
    }
    if (
        (condition === "open-box" || condition === "pre-owned") &&
        requested.has("used")
    ) {
        return true;
    }
    return false;
}

function hasDisallowedCondition(
    title: string,
    query: string,
    condition?: string,
    subCondition?: string,
): boolean {
    const normalizedTitle = normalizedWords(title);
    const requested = requestedNonNewConditions(query);
    const titleConditions = NON_NEW_CONDITION_ALIASES
        .filter(({ pattern }) => pattern.test(normalizedTitle))
        .map(({ key }) => key);
    const official = officialConditionKey(condition, subCondition);
    const requiresOfficialNew =
        explicitlyRejectsNonNewCondition(query) ||
        explicitlyRequiresNewCondition(query);

    if (official === "unknown") return true;
    if (official === null && requiresOfficialNew) return true;
    if (
        requiresOfficialNew &&
        (
            official !== "new" ||
            titleConditions.length > 0
        )
    ) {
        return true;
    }
    if (official && official !== "new") {
        if (!conditionIsExplicitlyAllowed(official, requested)) return true;
    } else if (
        official === "new" &&
        requested.size > 0 &&
        !titleConditions.some((key) =>
            conditionIsExplicitlyAllowed(key, requested),
        )
    ) {
        return true;
    } else if (
        official === null &&
        requested.size > 0 &&
        !titleConditions.some((key) =>
            conditionIsExplicitlyAllowed(key, requested),
        )
    ) {
        return true;
    }

    return titleConditions.some(
        (key) => !conditionIsExplicitlyAllowed(key, requested),
    );
}

function requiresCompleteKeyboard(query: string): boolean {
    const normalizedQuery = normalizedWords(query);
    if (!/\bkeyboards?\b/.test(normalizedQuery)) return false;
    return (
        /\b(?:complete|fully assembled|pre assembled|ready to use)\b/.test(
            normalizedQuery,
        ) ||
        /\b(?:not|no|without)\s+(?:a\s+)?barebones?\b/.test(normalizedQuery) ||
        /\b(?:exclude|excludes|excluded|excluding)(?:\s+[a-z0-9]+){0,6}\s+barebones?\b/.test(
            normalizedQuery,
        )
    );
}

function hasIncompleteKeyboardEvidence(
    title: string,
    features: string[],
): boolean {
    const normalizedTitle = normalizedWords(title)
        .replace(
            /\b(?:not|no|non|without)\s+(?:a\s+)?barebones?(?:\s+(?:keyboard|kit))?\b/g,
            " ",
        )
        .replace(/\s+/g, " ")
        .trim();
    const titleClaimsComplete =
        /\b(?:complete|fully assembled|pre assembled|ready to use)\b/.test(
            normalizedTitle,
        );
    const normalizedFeatureEvidence = normalizedWords(features.join(" "))
        .replace(
            /\b(?:not|no|non|without)\s+(?:a\s+)?barebones?(?:\s+(?:keyboard|kit))?\b/g,
            " ",
        )
        .replace(
            /\b(?:not|no|without)\s+(?:a\s+)?(?:diy\s+|custom\s+)?(?:mechanical\s+)?keyboard\s+kit\b/g,
            " ",
        )
        .replace(
            /\b(?:compatible with|works with|for use with|unlike)\s+(?:a\s+)?barebones?(?:\s+(?:keyboard|kit))?\b/g,
            " ",
        )
        .replace(
            /\b(?:also\s+)?available\s+(?:in|as)\s+(?:a\s+)?barebones?(?:\s+(?:keyboard|kit|version))?\b/g,
            " ",
        )
        .replace(/\s+/g, " ")
        .trim();
    const featureClaimsComplete =
        /\b(?:complete keyboard|fully assembled|pre assembled|ready to use)\b/.test(
            normalizedFeatureEvidence,
        ) ||
        /\b(?:includes?|comes with|pre installed)\b(?:\s+[a-z0-9]+){0,12}\s+switches?\b(?:\s+[a-z0-9]+){0,12}\s+keycaps?\b/.test(
            normalizedFeatureEvidence,
        ) ||
        /\b(?:includes?|comes with|pre installed)\b(?:\s+[a-z0-9]+){0,12}\s+keycaps?\b(?:\s+[a-z0-9]+){0,12}\s+switches?\b/.test(
            normalizedFeatureEvidence,
        );
    const ambiguousKitTitle =
        /\bkit\b/.test(normalizedTitle) &&
        !/\b(?:cleaning|maintenance|repair|accessory|keycap|switch)\s+kit\b/.test(
            normalizedTitle,
        ) &&
        !titleClaimsComplete &&
        !featureClaimsComplete;

    return (
        /\bbarebones?\b/.test(normalizedTitle) ||
        ambiguousKitTitle ||
        (
            !titleClaimsComplete &&
            (
                /\b(?:diy|custom)\s+(?:mechanical\s+)?keyboard\s+kit\b/.test(
                    normalizedTitle,
                ) ||
                /\b(?:mechanical\s+)?keyboard\s+(?:diy\s+)?kit\b/.test(
                    normalizedTitle,
                )
            )
        ) ||
        /\bbarebones?\s+(?:keyboard|kit|model|version|design|build|option)\b|\b(?:this|the)\s+(?:product|keyboard|kit|model|version)\s+(?:is\s+)?(?:a\s+)?barebones?\b|\b(?:keyboard|kit|model|version)\s+(?:is\s+)?barebones?\b/.test(
            normalizedFeatureEvidence,
        ) ||
        /\b(?:switches?|keycaps?)(?:\s+(?:and|or)\s+(?:switches?|keycaps?))?\s+(?:are\s+)?(?:not included|sold separately)\b/.test(
            normalizedFeatureEvidence,
        ) ||
        /\bdoes not include\b(?:\s+[a-z0-9]+){0,8}\s+(?:switches?|keycaps?)\b/.test(
            normalizedFeatureEvidence,
        ) ||
        /\b(?:requires?|need to add|add your own)\b(?:\s+[a-z0-9]+){0,8}\s+(?:switches?|keycaps?)\b/.test(
            normalizedFeatureEvidence,
        )
    );
}

function requiresWiredOnly(query: string): boolean {
    const normalizedQuery = normalizedWords(query);
    return (
        /\b(?:wired only|only wired|must be wired|keep only wired|show only wired|include only wired)\b/.test(
            normalizedQuery,
        ) ||
        /\b(?:not|no|without)\s+(?:a\s+)?(?:wireless(?!\s+(?:charging|charger))|bluetooth)\b/.test(
            normalizedQuery,
        ) ||
        /\b(?:exclude|excludes|excluded|excluding)(?:\s+[a-z0-9]+){0,6}\s+(?:wireless|bluetooth|2 4 ghz|2 4g)\b/.test(
            normalizedQuery,
        )
    );
}

function hasAffirmativeWirelessEvidence(evidence: string): boolean {
    const normalizedEvidence = normalizedWords(evidence)
        .replace(
            /\b(?:does not|doesn t|do not|don t|not|no|without|lacks|lacking)(?:\s+(?:support|supports|include|includes|have|has|any)){0,3}\s+(?:wireless|bluetooth|bt\d*|2 4 ghz(?: wireless)?|2 4g(?: wireless)?)(?:\s+(?:connectivity|mode|support))?(?:\s+(?:or|and)\s+(?:wireless|bluetooth|bt\d*|2 4 ghz(?: wireless)?|2 4g(?: wireless)?)(?:\s+(?:connectivity|mode|support))?)*\b/g,
            " ",
        )
        .replace(
            /\b(?:wireless|bluetooth|bt\d*|2 4 ghz(?: wireless)?|2 4g(?: wireless)?)(?:\s+(?:connectivity|mode|support))?\s+(?:is|are)\s+(?:not supported|not included|unavailable|absent)\b/g,
            " ",
        )
        .replace(/\b(?:wireless|bluetooth)\s+free\b/g, " ")
        .replace(
            /\bfree from\s+(?:wireless|bluetooth|2 4 ghz)(?:\s+interference)?\b/g,
            " ",
        )
        .replace(
            /\b(?:wireless|bluetooth|2 4 ghz)\s+interference\s+free\b/g,
            " ",
        )
        .replace(
            /\bwireless(?:\s+qi)?\s+(?:charg(?:e|er|ers|ing)|power)\b/g,
            " ",
        )
        .replace(/\s+/g, " ")
        .trim();
    return /\b(?:wireless|bluetooth|bt\d*|2 4 ghz|2 4g)\b/.test(
        normalizedEvidence,
    );
}

function requiresAffirmativeWirelessEvidence(query: string): boolean {
    return (
        !requiresWiredOnly(query) &&
        hasAffirmativeWirelessEvidence(query)
    );
}

function hasWiredEvidence(evidence: string): boolean {
    const normalizedEvidence = normalizedWords(evidence);
    return (
        /\b(?:wired|corded)\b/.test(normalizedEvidence) ||
        /\b(?:usb|usb c|type c)\s+(?:cable|connection|connected)\b/.test(
            normalizedEvidence,
        ) ||
        /\b(?:usb|usb c)\s+(?:mechanical\s+)?keyboard\b/.test(
            normalizedEvidence,
        )
    );
}

type KeyboardLayout = "60" | "65" | "75" | "80" | "96" | "100";

function requestedKeyboardLayouts(query: string): KeyboardLayout[] {
    const normalizedQuery = normalizedWords(query);
    if (!/\bkeyboards?\b/.test(normalizedQuery)) return [];

    const layouts = new Set<KeyboardLayout>();
    for (const match of query.matchAll(/\b(60|65|75|80|96|100)\s*(?:%|percent\b)/gi)) {
        const suffix = query.slice((match.index ?? 0) + match[0].length);
        if (
            /^\s*(?:off|discount|(?:(?:mac|windows|device|system)\s+)?compatib(?:le|ility))\b/i.test(
                suffix,
            )
        ) {
            continue;
        }
        layouts.add(match[1] as KeyboardLayout);
    }
    if (/\b(?:tkl|tenkeyless)\b/.test(normalizedQuery)) layouts.add("80");
    if (/\bfull size\b/.test(normalizedQuery)) layouts.add("100");
    return [...layouts];
}

function provesKeyboardLayout(
    layout: KeyboardLayout,
    title: string,
    features: string[],
): boolean {
    const normalizedTitle = normalizedWords(title.replace(/%/g, " percent "));
    const normalizedFeatures = normalizedWords(
        features.join(" ").replace(/%/g, " percent "),
    )
        .replace(
            /\b(?:compatible with|fits|for use with|designed for)\b(?:\s+[a-z0-9]+){0,20}\s+(?:keyboards?|layouts?|keycaps?)\b/g,
            " ",
        )
        .replace(
            /\b(?:compatible with|fits|for use with|designed for)(?:\s+[a-z0-9]+){0,8}\s+(?:(?:60|65|75|80|96|100)\s+percent|(?:61|62|64|66|67|68|81|82|84|87|88|96|98|104|105|108)\s+keys?)\b/g,
            " ",
        )
        .replace(/\s+/g, " ")
        .trim();

    const patterns: Record<KeyboardLayout, RegExp> = {
        "60": /\b60 percent\b|\b(?:61|62|64)\s+keys?\b/,
        "65": /\b65 percent\b|\b(?:66|67|68)\s+keys?\b/,
        "75": /\b75 percent\b|\b(?:81|82|84)\s+keys?\b/,
        "80": /\b80 percent\b|\b(?:tkl|tenkeyless)\b|\b(?:87|88)\s+keys?\b/,
        "96": /\b96 percent\b|\b(?:96|98)\s+keys?\b|\b1800\s+(?:compact\s+)?layout\b/,
        "100": /\b100 percent\b|\bfull size\b|\b(?:104|105|108)\s+keys?\b/,
    };
    const pattern = patterns[layout];
    return pattern.test(normalizedTitle) || pattern.test(normalizedFeatures);
}

function canonicalProductFamilyKey(title: string, brand?: string): string {
    const normalizedBrand = normalizedWords(brand ?? "");
    const brandWords = new Set(normalizedBrand.split(" ").filter(Boolean));
    const withoutPackageVariation = normalizedWords(
        title.replace(/[×✕]/g, " x "),
    )
        .replace(
            /\b\d+\s*(?:packs?|pk|boxes?|cases?|cartons?|lots?|bundles?|sets?)\s+of\s+\d+\b/g,
            " ",
        )
        .replace(
            /\b(?:pack|set|bundle|case|lot|box)\s+of\s+\d+\b/g,
            " ",
        )
        .replace(
            /\b\d+\s*(?:x|by)\s*\d+\s+(?=(?:ready\s+to\s+use\s+)?(?:ant\s+)?(?:baits?|bait\s+stations?|stations?|traps?|refills?|pods?|filters?|bags?|rolls?|wipes?|capsules?)\b)/g,
            " ",
        )
        .replace(
            /\b\d+\s*(?:packs?|pk|count|ct|pieces?|pcs?|units?|boxes?|cases?|cartons?|lots?|bundles?)(?:\s+(?:packs?|boxes?|cases?|cartons?|lots?|bundles?))?\b/g,
            " ",
        )
        .replace(
            /\b(?:packs?|pk|count|ct|pieces?|pcs?|units?)\s+\d+\b/g,
            " ",
        )
        .replace(
            /\b\d+\s+total\s+(?=(?:ready\s+to\s+use\s+)?(?:ant\s+)?(?:baits?|bait\s+stations?|stations?|traps?|refills?|pods?|filters?|bags?|rolls?|wipes?|capsules?)\b)/g,
            " ",
        )
        .replace(
            /\b\d+\s+(?=(?:ready\s+to\s+use\s+)?(?:ant\s+)?(?:baits?|bait\s+stations?|stations?|traps?|refills?|pods?|filters?|bags?|rolls?|wipes?|capsules?)\b)/g,
            " ",
        )
        .replace(
            /\b((?:ready\s+to\s+use\s+)?(?:ant\s+)?(?:baits?|bait\s+stations?|stations?|traps?|refills?|pods?|filters?|bags?|rolls?|wipes?|capsules?))\s+(?:total|per\s+(?:packs?|boxes?|cases?|cartons?|lots?|bundles?))\b/g,
            "$1",
        )
        .replace(/\b(?:bulk|economy|family|value)\s+pack\b/g, " ")
        .replace(/\beach\b/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const words = withoutPackageVariation.split(" ");
    const core = words
        .filter(
            (word, index) =>
                !VARIANT_COLOR_WORDS.has(word) ||
                brandWords.has(word) ||
                words[index - 1] === "switch" ||
                words[index + 1] === "switch" ||
                words[index + 1] === "switches",
        )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    const normalizedCore = core || withoutPackageVariation;
    return normalizedBrand &&
        normalizedCore !== normalizedBrand &&
        !normalizedCore.startsWith(`${normalizedBrand} `)
        ? `${normalizedBrand} ${normalizedCore}`
        : normalizedCore;
}

function productFamilyKeys(
    product: Pick<EnrichedProductRow, "parentAsin" | "title" | "brand">,
): string[] {
    if (/^[A-Z0-9]{10}$/i.test(product.parentAsin ?? "")) {
        return [`parent:${product.parentAsin!.toUpperCase()}`];
    }
    return [
        `title:${canonicalProductFamilyKey(product.title, product.brand)}`,
    ];
}

function dedupeRankedProductFamilies(
    rows: EnrichedProductRow[],
): EnrichedProductRow[] {
    const seen = new Set<string>();
    return rows.filter((row) => {
        const keys = productFamilyKeys(row);
        if (keys.some((key) => seen.has(key))) return false;
        for (const key of keys) seen.add(key);
        return true;
    });
}

function extractMinimumWattage(query: string): number | null {
    const match = query.match(
        /\b(?:at least|minimum(?: of)?|min(?:imum)?\.?)\s*(\d{2,3})\s*w(?:atts?)?\b/i,
    );
    if (!match) return null;
    const watts = Number(match[1]);
    return Number.isFinite(watts) ? watts : null;
}

function extractHostDeliveryWattages(
    evidence: string,
    allowMonitorPowerDelivery = false,
): number[] {
    const clauses = evidence
        .split(/[.;|•]+/)
        .map((clause) => normalizedWords(clause))
        .filter(Boolean);
    const values: number[] = [];
    for (const clause of clauses) {
        if (!/\b(?:usb c|type c)\b/.test(clause)) continue;
        if (
            !allowMonitorPowerDelivery &&
            !/\b(?:host|laptop|macbook|notebook)\b/.test(clause)
        ) {
            continue;
        }
        if (!/\b(?:power delivery|pd|charg(?:e|es|ing))\b/.test(clause)) {
            continue;
        }
        for (const match of clause.matchAll(/\b(\d{2,3})\s*w(?:atts?)?\b/g)) {
            const watts = Number(match[1]);
            if (Number.isFinite(watts)) values.push(watts);
        }
    }
    return values;
}

function requiresNoNumpad(query: string): boolean {
    return /\b(?:no|without)\s+(?:a\s+)?(?:numpad|number pad|numeric keypad)\b/.test(
        normalizedWords(query),
    );
}

function provesNoNumpad(title: string, features: string[]): boolean {
    const normalizedEvidence = normalizedWords(`${title} ${features.join(" ")}`);
    const explicitAbsence =
        /\b(?:no|without|lacks|lacking)\s+(?:a\s+)?(?:numpad|number pad|numeric keypad)\b/.test(
            normalizedEvidence,
        );
    const evidenceWithoutAbsence = normalizedEvidence
        .replace(
            /\b(?:no|without|lacks|lacking)\s+(?:a\s+)?(?:numpad|number pad|numeric keypad)\b/g,
            " ",
        )
        .replace(/\s+/g, " ")
        .trim();
    const affirmativeNumpad =
        /\b(?:numpad|number pad|numeric keypad)\b/.test(
            evidenceWithoutAbsence,
        ) ||
        /\b(?:full size|96|98|100)\s*(?:percent|keys?|key|layout)\b/.test(
            evidenceWithoutAbsence,
        ) ||
        /\b(?:96|98|100)\s*%/.test(
            `${title} ${features.join(" ")}`.toLowerCase(),
        ) ||
        /\b(?:104|105|108)\s*(?:keys?|key)\b/.test(evidenceWithoutAbsence);
    if (affirmativeNumpad) return false;

    const recognizedNoNumpadLayout =
        /\b(?:60|65|68|75|80)\s*(?:percent|layout)\b|\b(?:61|62|64|66|67|68|81|82|84|87|88)\s*(?:keys?|key)\b|\b(?:tkl|tenkeyless)\b/.test(
            evidenceWithoutAbsence,
        ) ||
        /\b(?:60|65|68|75|80)\s*%/.test(
            `${title} ${features.join(" ")}`.toLowerCase(),
        );
    return explicitAbsence || recognizedNoNumpadLayout;
}

function hasAffirmativePlatformEvidence(
    evidence: string,
    platform: "mac" | "windows",
): boolean {
    const normalized = normalizedWords(evidence);
    const platformPattern = platform === "mac" ? "mac(?:os)?" : "windows";
    const cleaned = normalized
        .replace(
            new RegExp(
                `\\b(?:not|no|without|does not|doesn t|incompatible with|not compatible with|does not support|doesn t support|unsupported on)\\b(?:\\s+[a-z0-9]+){0,4}\\s+${platformPattern}\\b`,
                "g",
            ),
            " ",
        )
        .replace(
            new RegExp(
                `\\b${platformPattern}\\b(?:\\s+[a-z0-9]+){0,4}\\s+(?:is\\s+not\\s+supported|not\\s+supported|unsupported|incompatible)\\b`,
                "g",
            ),
            " ",
        )
        .replace(/\s+/g, " ")
        .trim();
    return new RegExp(`\\b${platformPattern}\\b`).test(cleaned);
}

type EvidenceComparator =
    | "exact"
    | "at-least"
    | "more-than"
    | "at-most"
    | "less-than";

interface NumericEvidenceRequirement {
    amount: number;
    comparator: EvidenceComparator;
    unit: string;
    label: string;
}

interface PhraseEvidenceRequirement {
    kind: "positive" | "absence" | "exclusive";
    label: string;
    tokens: string[];
    requiresInclusionLanguage: boolean;
}

const NUMERIC_UNIT_PATTERN =
    "(?:fl\\s*oz|ounces?|oz|milliliters?|ml|liters?|litres?|l|grams?|g|kilograms?|kg|pounds?|lbs?|inches?|inch|in|centimeters?|cm|millimeters?|mm|feet|foot|ft|watts?|w|volts?|v|amps?|a|mah|wh|gigabytes?|gb|terabytes?|tb|hertz|hz|kilohertz|khz|megahertz|mhz|gigahertz|ghz|lumens?|lm|decibels?|db|cfm|psi|btu|hours?|hrs?|minutes?|mins?|seconds?|secs?|outlets?|ports?|pieces?|count|packs?)";

function canonicalEvidenceUnit(value: string): string {
    const unit = normalizedWords(value).replace(/\s+/g, "");
    if (/^(?:floz|ounce|ounces|oz)$/.test(unit)) return "oz";
    if (/^(?:milliliter|milliliters|ml)$/.test(unit)) return "ml";
    if (/^(?:liter|liters|litre|litres|l)$/.test(unit)) return "l";
    if (/^(?:gram|grams|g)$/.test(unit)) return "g";
    if (/^(?:kilogram|kilograms|kg)$/.test(unit)) return "kg";
    if (/^(?:pound|pounds|lb|lbs)$/.test(unit)) return "lb";
    if (/^(?:inch|inches|in)$/.test(unit)) return "in";
    if (/^(?:centimeter|centimeters|cm)$/.test(unit)) return "cm";
    if (/^(?:millimeter|millimeters|mm)$/.test(unit)) return "mm";
    if (/^(?:feet|foot|ft)$/.test(unit)) return "ft";
    if (/^(?:watt|watts|w)$/.test(unit)) return "w";
    if (/^(?:volt|volts|v)$/.test(unit)) return "v";
    if (/^(?:amp|amps|a)$/.test(unit)) return "a";
    if (/^(?:hour|hours|hr|hrs)$/.test(unit)) return "hour";
    if (/^(?:minute|minutes|min|mins)$/.test(unit)) return "minute";
    if (/^(?:second|seconds|sec|secs)$/.test(unit)) return "second";
    if (/^(?:outlet|outlets)$/.test(unit)) return "outlet";
    if (/^(?:port|ports)$/.test(unit)) return "port";
    if (/^(?:piece|pieces|count|pack|packs)$/.test(unit)) return "count";
    return unit;
}

function occurrenceIsNegated(query: string, index: number): boolean {
    const prefix = normalizedWords(query.slice(Math.max(0, index - 60), index));
    return /\b(?:no|not|without|exclude|excluding|less than|under|below)\b(?:\s+[a-z0-9]+){0,5}$/.test(
        prefix,
    );
}

function extractNumericEvidenceRequirements(
    query: string,
): NumericEvidenceRequirement[] {
    const expression = new RegExp(
        `\\b(?:(at\\s+least|minimum(?:\\s+of)?|min(?:imum)?\\.?|more\\s+than|over|greater\\s+than|up\\s+to|at\\s+most|no\\s+more\\s+than|under|below|less\\s+than)\\s*)?(\\d+(?:\\.\\d+)?)\\s*(${NUMERIC_UNIT_PATTERN})\\b`,
        "gi",
    );
    const requirements: NumericEvidenceRequirement[] = [];
    const seen = new Set<string>();
    for (const match of query.matchAll(expression)) {
        const index = match.index ?? 0;
        if (occurrenceIsNegated(query, index) && !match[1]) continue;
        const amount = Number(match[2]);
        if (!Number.isFinite(amount)) continue;
        const comparatorWords = normalizedWords(match[1] ?? "");
        const comparator: EvidenceComparator =
            /\b(?:more than|over|greater than)\b/.test(comparatorWords)
                ? "more-than"
                : /\b(?:at least|minimum|min)\b/.test(comparatorWords)
                  ? "at-least"
                  : /\b(?:under|below|less than)\b/.test(comparatorWords)
                    ? "less-than"
                    : /\b(?:up to|at most|no more than)\b/.test(
                        comparatorWords,
                    )
                      ? "at-most"
                      : "exact";
        const unit = canonicalEvidenceUnit(match[3]);
        const key = `${comparator}|${amount}|${unit}`;
        if (seen.has(key)) continue;
        seen.add(key);
        requirements.push({
            amount,
            comparator,
            unit,
            label: match[0].trim(),
        });
    }
    return requirements;
}

function evidenceNumbersForUnit(evidence: string, unit: string): number[] {
    const expression = new RegExp(
        `\\b(\\d+(?:\\.\\d+)?)\\s*(${NUMERIC_UNIT_PATTERN})\\b`,
        "gi",
    );
    const values: number[] = [];
    for (const match of evidence.matchAll(expression)) {
        if (canonicalEvidenceUnit(match[2]) !== unit) continue;
        const amount = Number(match[1]);
        if (Number.isFinite(amount)) values.push(amount);
    }
    return values;
}

function satisfiesNumericRequirement(
    requirement: NumericEvidenceRequirement,
    evidence: string,
): boolean {
    const values = evidenceNumbersForUnit(evidence, requirement.unit);
    return values.some((value) => {
        if (requirement.comparator === "at-least") {
            return value >= requirement.amount;
        }
        if (requirement.comparator === "more-than") {
            return value > requirement.amount;
        }
        if (requirement.comparator === "at-most") {
            return value <= requirement.amount;
        }
        if (requirement.comparator === "less-than") {
            return value < requirement.amount;
        }
        return Math.abs(value - requirement.amount) < 0.0001;
    });
}

const MATERIAL_REQUIREMENTS = [
    ["stainless steel", ["stainless", "steel"]],
    ["aluminum", ["aluminum"]],
    ["aluminium", ["aluminium"]],
    ["titanium", ["titanium"]],
    ["bamboo", ["bamboo"]],
    ["ceramic", ["ceramic"]],
    ["silicone", ["silicone"]],
    ["leather", ["leather"]],
    ["cotton", ["cotton"]],
    ["polyester", ["polyester"]],
    ["nylon", ["nylon"]],
    ["latex", ["latex"]],
    ["glass", ["glass"]],
    ["wood", ["wood"]],
] as const;

const CERTIFICATION_REQUIREMENTS = [
    ["UL listed", ["ul", "listed"]],
    ["ETL listed", ["etl", "listed"]],
    ["Energy Star certified", ["energy", "star"]],
    ["NSF certified", ["nsf"]],
    ["FSC certified", ["fsc"]],
    ["GOTS certified", ["gots"]],
    ["OEKO-TEX certified", ["oeko", "tex"]],
    ["RoHS compliant", ["rohs"]],
    ["GREENGUARD certified", ["greenguard"]],
    ["BIFMA certified", ["bifma"]],
] as const;

const PHRASE_STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "be",
    "every",
    "have",
    "include",
    "includes",
    "including",
    "must",
    "only",
    "support",
    "supports",
    "the",
    "to",
]);

function phraseTokens(value: string): string[] {
    const rawTokens = normalizedWords(value).split(" ");
    const tokens: string[] = [];
    for (let index = 0; index < rawTokens.length; index += 1) {
        const token = rawTokens[index];
        const next = rawTokens[index + 1] ?? "";
        if (
            /^\d+(?:\.\d+)?$/.test(token) &&
            new RegExp(`^${NUMERIC_UNIT_PATTERN}$`, "i").test(next)
        ) {
            index += 1;
            continue;
        }
        if (
            /^\d+(?:\.\d+)?(?:oz|ml|l|g|kg|lb|in|cm|mm|ft|w|v|a|mah|wh|gb|tb|hz|khz|mhz|ghz|lm|db|cfm|psi|btu|hrs?|mins?|secs?)$/.test(
                token,
            )
        ) {
            continue;
        }
        if (
            token.length <= 1 ||
            PHRASE_STOP_WORDS.has(token) ||
            /^(?:at|least|minimum|min|maximum|max|up)$/.test(token)
        ) {
            continue;
        }
        tokens.push(token);
    }
    return Array.from(new Set(tokens)).slice(0, 10);
}

function phraseIsHandledElsewhere(label: string): boolean {
    const normalized = normalizedWords(label);
    return (
        /\b(?:mac|macos)\b/.test(normalized) &&
        /\bwindows\b/.test(normalized)
    ) ||
        /\b(?:internet|wifi|wi fi|subscription|numpad|number pad|numeric keypad)\b/.test(
            normalized,
        ) ||
        /\b(?:wired|wireless|bluetooth|barebones|refurbished|renewed|used|open box|pre owned)\b/.test(
            normalized,
        ) ||
        /\b(?:bpa|pfas|latex)\s+free\b/.test(normalized);
}

function addPhraseRequirement(
    requirements: PhraseEvidenceRequirement[],
    seen: Set<string>,
    kind: PhraseEvidenceRequirement["kind"],
    label: string,
    requiresInclusionLanguage: boolean,
): void {
    const cleaned = label
        .replace(/\b(?:under|below|less than|up to|at most)\b.*$/i, " ")
        .replace(/\bfor\s+(?:a|an|the)\s+.+$/i, " ")
        .trim();
    if (!cleaned || phraseIsHandledElsewhere(cleaned)) return;
    const tokens = phraseTokens(cleaned);
    if (tokens.length === 0) return;
    const key = `${kind}|${tokens.join("|")}`;
    if (seen.has(key)) return;
    seen.add(key);
    requirements.push({
        kind,
        label: cleaned,
        tokens,
        requiresInclusionLanguage,
    });
}

function extractPhraseEvidenceRequirements(
    query: string,
): PhraseEvidenceRequirement[] {
    const requirements: PhraseEvidenceRequirement[] = [];
    const seen = new Set<string>();

    for (const match of query.matchAll(
        /\b(?:with|including)\s+([^,;]{1,100}?)(?=$|[,;]|\bbut\b)/gi,
    )) {
        if (/^\s*(?:no|not|without)\b/i.test(match[1])) continue;
        addPhraseRequirement(requirements, seen, "positive", match[1], true);
    }
    for (const match of query.matchAll(
        /\b(?:must|needs?\s+to|required?\s+to)\s+(?:have|include|support|use|be)\s+([^,;]{1,100}?)(?=$|[,;]|\bbut\b)/gi,
    )) {
        addPhraseRequirement(requirements, seen, "positive", match[1], false);
    }
    for (const match of query.matchAll(
        /\b(?:without|no)\s+([^,;]{1,80}?)(?=$|[,;]|\bbut\b)/gi,
    )) {
        if (/^\s*more\s+than\b/i.test(match[1])) continue;
        addPhraseRequirement(requirements, seen, "absence", match[1], false);
    }
    for (const match of query.matchAll(
        /\bnot\s+([^,;]{1,60}?)(?=$|[,;]|\bbut\b)/gi,
    )) {
        addPhraseRequirement(requirements, seen, "absence", match[1], false);
    }
    for (const match of query.matchAll(
        /\bonly\s+([^,;]{1,80}?)(?=$|[,;]|\bbut\b)/gi,
    )) {
        addPhraseRequirement(requirements, seen, "exclusive", match[1], false);
    }
    for (const match of query.matchAll(
        /(?:^|[,;])\s*([^,;]{1,80}?)\s+only\b/gi,
    )) {
        addPhraseRequirement(requirements, seen, "exclusive", match[1], false);
    }

    const normalizedQuery = normalizedWords(query);
    for (const [label, tokens] of MATERIAL_REQUIREMENTS) {
        if (!tokens.every((token) => normalizedQuery.includes(token))) continue;
        if (
            new RegExp(`\\b${tokens.join("\\s+")}\\s+free\\b`).test(
                normalizedQuery,
            )
        ) {
            continue;
        }
        const matchIndex = normalizedQuery.indexOf(tokens[0]);
        if (occurrenceIsNegated(normalizedQuery, matchIndex)) continue;
        addPhraseRequirement(requirements, seen, "positive", label, false);
    }
    for (const [label, tokens] of CERTIFICATION_REQUIREMENTS) {
        if (!tokens.every((token) => normalizedQuery.includes(token))) continue;
        addPhraseRequirement(requirements, seen, "positive", label, false);
    }

    return requirements;
}

function normalizedEvidenceClauses(
    title: string,
    features: string[],
): Array<{ value: string; isTitle: boolean }> {
    return [
        { value: normalizedWords(title), isTitle: true },
        ...features
            .flatMap((feature) => feature.split(/[.;|•]+/))
            .map((feature) => ({
                value: normalizedWords(feature),
                isTitle: false,
            })),
    ].filter((clause) => clause.value);
}

function clauseContainsTokens(clause: string, tokens: string[]): boolean {
    const words = new Set(clause.split(" "));
    return tokens.every((token) => words.has(token));
}

function clauseNegatesTokens(clause: string, tokens: string[]): boolean {
    if (!clauseContainsTokens(clause, tokens)) return false;
    const firstIndex = Math.min(
        ...tokens.map((token) => clause.split(" ").indexOf(token)),
    );
    const words = clause.split(" ");
    const prefix = words.slice(Math.max(0, firstIndex - 7), firstIndex).join(" ");
    const suffix = words
        .slice(firstIndex + 1, firstIndex + tokens.length + 7)
        .join(" ");
    return (
        /\b(?:no|not|without|lacks|lacking|exclude|excludes|excluding|free of)\b/.test(
            prefix,
        ) ||
        /\b(?:not included|sold separately|not supported|unavailable|absent|optional only)\b/.test(
            suffix,
        ) ||
        new RegExp(`\\b${tokens.join("\\s+")}\\s+free\\b`).test(clause)
    );
}

function satisfiesPhraseRequirement(
    requirement: PhraseEvidenceRequirement,
    title: string,
    features: string[],
): boolean {
    const clauses = normalizedEvidenceClauses(title, features);
    if (requirement.kind === "absence") {
        return clauses.some(
            ({ value }) =>
                clauseContainsTokens(value, requirement.tokens) &&
                clauseNegatesTokens(value, requirement.tokens),
        );
    }
    if (requirement.kind === "exclusive") {
        return clauses.some(
            ({ value }) =>
                clauseContainsTokens(value, requirement.tokens) &&
                !clauseNegatesTokens(value, requirement.tokens) &&
                /\bonly\b/.test(value),
        );
    }

    return clauses.some(({ value, isTitle }) => {
        if (
            !clauseContainsTokens(value, requirement.tokens) ||
            clauseNegatesTokens(value, requirement.tokens)
        ) {
            return false;
        }
        if (!requirement.requiresInclusionLanguage || isTitle) return true;
        return !/\b(?:compatible with|works with|for use with|sold separately|optional accessory)\b/.test(
            value,
        );
    });
}

function normalizedConstraintToken(token: string): string {
    if (/^requir(?:e|ed|es)$/.test(token)) return "require";
    return token.replace(/s$/, "");
}

function absenceRequirementUsesThreeValuedPolicy(
    requirement: PhraseEvidenceRequirement,
    decisions: ConstraintDecision[],
): boolean {
    if (requirement.kind !== "absence") return false;
    const requirementTokens = requirement.tokens.map(
        normalizedConstraintToken,
    );
    return decisions.some((decision) => {
        const claimTokens = new Set(
            normalizedWords(decision.claim)
                .split(" ")
                .map(normalizedConstraintToken),
        );
        return requirementTokens.every((token) => claimTokens.has(token));
    });
}

function satisfiesGenericHardConstraints(
    query: string,
    title: string,
    features: string[],
): boolean {
    const evidence = `${title}. ${features.join(". ")}`;
    const threeValuedDecisions = evaluateListingConstraints({
        query,
        title,
        features,
    }).decisions;
    return (
        extractNumericEvidenceRequirements(query).every((requirement) =>
            satisfiesNumericRequirement(requirement, evidence),
        ) &&
        extractPhraseEvidenceRequirements(query)
            .every((requirement) =>
                absenceRequirementUsesThreeValuedPolicy(
                    requirement,
                    threeValuedDecisions,
                ) ||
                satisfiesPhraseRequirement(requirement, title, features),
            )
    );
}

function isUnexpectedListing(
    title: string,
    query: string,
    features: string[] = [],
    condition?: string,
    subCondition?: string,
): boolean {
    const normalizedTitle = normalizedWords(title);
    const normalizedQuery = normalizedWords(query);
    const normalizedEvidence = normalizedWords(`${title} ${features.join(" ")}`);

    const constraintEvaluation = evaluateListingConstraints({
        query,
        title,
        features,
    });
    if (constraintEvaluation.blocks) {
        return true;
    }
    if (!provesRequestedProductIdentity(query, title)) {
        return true;
    }
    if (violatesPestProductSpecificityCore(query, title, features)) {
        return true;
    }
    if (/\bkeyboards?\b/.test(normalizedQuery) && !/\bkeyboards?\b/.test(normalizedTitle)) {
        return true;
    }
    if (/\bheadphones?\b/.test(normalizedQuery) && !/\bheadphones?\b/.test(normalizedTitle)) {
        return true;
    }
    if (/\bmonitor\b/.test(normalizedQuery)) {
        if (!/\bmonitor\b/.test(normalizedTitle)) return true;
        if (
            !/\b(?:1[3-9]|[2-4]\d)(?:\.\d+)?[\s-]*(?:"|″|inch(?:es)?\b)/i.test(
                title,
            )
        ) {
            return true;
        }
        if (
            /\b(?:monitor\s+(?:arm|mount|stand|light)|(?:arm|mount|stand)\s+for\s+(?:a\s+)?monitor)\b/.test(
                normalizedTitle,
            )
        ) {
            return true;
        }
    }
    if (
        /\brobot\s+vacuum\b/.test(normalizedQuery) &&
        (!/\brobot(?:ic)?\b/.test(normalizedTitle) || !/\bvacuum\b/.test(normalizedTitle))
    ) {
        return true;
    }

    if (
        /\bmechanical\s+keyboard\b/.test(normalizedQuery) &&
        !/\bmechanical\b/.test(normalizedTitle)
    ) {
        return true;
    }
    const requestedLayouts = requestedKeyboardLayouts(query);
    if (
        requestedLayouts.length > 0 &&
        !requestedLayouts.some((layout) =>
            provesKeyboardLayout(layout, title, features),
        )
    ) {
        return true;
    }
    if (
        /\bmac\b/.test(normalizedQuery) &&
        /\bwindows\b/.test(normalizedQuery) &&
        (
            !hasAffirmativePlatformEvidence(
                `${title}. ${features.join(". ")}`,
                "mac",
            ) ||
            !hasAffirmativePlatformEvidence(
                `${title}. ${features.join(". ")}`,
                "windows",
            )
        )
    ) {
        return true;
    }
    if (/\b(?:without internet|no wifi|no wi fi|offline)\b/.test(normalizedQuery)) {
        if (
            /\b(?:requires? (?:wifi|wi fi|an? app)|(?:wifi|wi fi|app) required|only (?:works|operates) with (?:wifi|wi fi|an? app))\b/.test(
                normalizedEvidence,
            )
        ) {
            return true;
        }
        if (
            !/\b(?:remote control|no wifi|no wi fi|without wifi|button control)\b/.test(
                normalizedEvidence,
            )
        ) {
            return true;
        }
    }
    if (/\b(?:no|without)\s+(?:a\s+)?subscription\b/.test(normalizedQuery)) {
        if (
            !/\b(?:no subscription|subscription free|without subscription|no monthly (?:fee|fees)|no recurring (?:fee|fees))\b/.test(
                normalizedEvidence,
            )
        ) {
            return true;
        }
    }

    const minimumWattage = extractMinimumWattage(query);
    if (minimumWattage !== null) {
        const officialEvidence = `${title}. ${features.join(". ")}`;
        const hostWattages = extractHostDeliveryWattages(
            officialEvidence,
            /\bmonitor\b/.test(normalizedQuery) &&
                /\bmonitor\b/.test(normalizedTitle),
        );
        if (
            hostWattages.length === 0 ||
            Math.max(...hostWattages) < minimumWattage
        ) {
            return true;
        }
    }

    if (
        requiresCompleteKeyboard(query) &&
        hasIncompleteKeyboardEvidence(title, features)
    ) {
        return true;
    }
    if (
        /\bbarebones?\b/.test(normalizedTitle) &&
        !/\bbarebones?\b/.test(normalizedQuery)
    ) {
        return true;
    }
    if (
        /\breplacement\b/.test(normalizedTitle) &&
        !/\breplacement\b/.test(normalizedQuery)
    ) {
        return true;
    }

    if (hasDisallowedCondition(title, query, condition, subCondition)) {
        return true;
    }

    for (const marker of ACCESSORY_MARKERS) {
        const accessoryListing = new RegExp(
            `^(?:[a-z0-9]+\\s+){0,5}${marker}\\s+(?:for|compatible\\s+with)\\b`,
        ).test(normalizedTitle);
        const accessoryOnly = new RegExp(`\\b${marker}\\s+only\\b`).test(normalizedTitle);
        if (
            (accessoryListing || accessoryOnly) &&
            !normalizedQuery.includes(marker)
        ) {
            return true;
        }
    }

    if (requiresNoNumpad(query) && !provesNoNumpad(title, features)) {
        return true;
    }

    if (requiresWiredOnly(query)) {
        if (
            !hasWiredEvidence(`${title} ${features.join(" ")}`) ||
            hasAffirmativeWirelessEvidence(`${title} ${features.join(" ")}`)
        ) {
            return true;
        }
    }

    if (
        requiresAffirmativeWirelessEvidence(query) &&
        !hasAffirmativeWirelessEvidence(
            `${title} ${features.join(" ")}`,
        )
    ) {
        return true;
    }

    if (
        /\bhot swappable\b/.test(normalizedQuery) &&
        !/\bhot swappable\b/.test(normalizedEvidence)
    ) {
        return true;
    }

    if (
        /\b(?:active )?noise cancel(?:ing|ling)\b/.test(normalizedQuery) &&
        !/\b(?:active |adaptive |hybrid )?noise cancel(?:ing|ling)\b|\banc\b/.test(
            normalizedEvidence,
        )
    ) {
        return true;
    }

    for (const explicitNegative of ["bpa free", "pfas free", "latex free"]) {
        if (
            normalizedQuery.includes(explicitNegative) &&
            !normalizedEvidence.includes(explicitNegative)
        ) {
            return true;
        }
    }

    if (!satisfiesGenericHardConstraints(query, title, features)) {
        return true;
    }

    return false;
}

function filterAmazonItems(
    items: AmazonProduct[],
    query: string,
    options: { dedupeVariants?: boolean } = {},
): AmazonProduct[] {
    const ceiling = extractPriceCeiling(query);
    const seen = new Set<string>();
    const seenVariants = new Set<string>();
    const dedupeVariants = options.dedupeVariants ?? true;
    return items.filter((item) => {
        if (seen.has(item.asin)) return false;
        const variantKey = canonicalProductFamilyKey(item.title, item.brand);
        if (dedupeVariants && seenVariants.has(variantKey)) return false;
        const fits =
            !isUnexpectedListing(
                item.title,
                query,
                item.features,
                item.condition,
                item.subCondition,
            ) &&
            fitsPriceCeiling(item.price, ceiling);
        if (!fits) return false;
        seen.add(item.asin);
        if (dedupeVariants) seenVariants.add(variantKey);
        return true;
    });
}

function exactTitleFitScore(title: string, query: string): number {
    const normalizedTitle = normalizedWords(title);
    const normalizedQuery = normalizedWords(query);
    let score = 0;

    if (/\bquiet\b/.test(normalizedQuery)) {
        if (/\bsilent\b/.test(normalizedTitle)) score += 40;
        else if (/\bquiet\b/.test(normalizedTitle)) score += 24;
        else if (/\b(?:brown|red)\s+switch(?:es)?\b/.test(normalizedTitle)) score += 4;
    }
    if (
        /\b(?:no|without)\s+(?:a\s+)?(?:numpad|number pad|numeric keypad)\b/.test(
            normalizedQuery,
        ) &&
        /\b(?:60|65|75|80)\s*(?:percent)?\b|\b(?:84|87)\s*(?:keys?|key)\b|\b(?:tkl|tenkeyless|compact)\b/.test(
            normalizedTitle,
        )
    ) {
        score += 12;
    }
    if (/\bhot swappable\b/.test(normalizedQuery) && /\bhot swappable\b/.test(normalizedTitle)) {
        score += 16;
    }
    if (/\bwireless\b/.test(normalizedQuery) && /\bwireless\b/.test(normalizedTitle)) {
        score += 12;
    }
    if (/\busb c\b/.test(normalizedQuery) && /\busb c\b/.test(normalizedTitle)) {
        score += 10;
    }
    if (
        /\bmac\b/.test(normalizedQuery) &&
        /\bwindows\b/.test(normalizedQuery) &&
        /\bmac\b/.test(normalizedTitle) &&
        /\bwindows\b/.test(normalizedTitle)
    ) {
        score += 10;
    }
    if (/\bnoise cancel(?:ing|ling)\b/.test(normalizedQuery)) {
        if (
            /^(?:wireless|hybrid|active)\s+(?:active\s+)?noise cancel(?:ing|ling)/.test(
                normalizedTitle,
            )
        ) {
            score -= 10;
        }
        if (/\badaptive active noise cancel(?:ing|ling)\b/.test(normalizedTitle)) {
            score += 24;
        } else if (/\bhybrid active noise cancel(?:ing|ling)\b/.test(normalizedTitle)) {
            score += 20;
        } else if (/\bactive noise cancel(?:ing|ling)\b/.test(normalizedTitle)) {
            score += 16;
        } else if (/\bnoise cancel(?:ing|ling)\b/.test(normalizedTitle)) {
            score += 8;
        }
        if (/\b(?:travel|traveling|flight)\b/.test(normalizedTitle)) score += 8;
    }
    if (/\brobot vacuum\b/.test(normalizedQuery)) {
        if (/\bpet hair\b/.test(normalizedTitle)) score += 20;
        if (/\b(?:remote control|no wifi|no wi fi|without wifi)\b/.test(normalizedTitle)) {
            score += 20;
        }
        if (/\b(?:tangle free|anti tangle)\b/.test(normalizedTitle)) score += 10;
    }

    return score;
}

const RANKING_STOP_WORDS = new Set([
    "about",
    "after",
    "amazon",
    "best",
    "find",
    "from",
    "good",
    "have",
    "less",
    "more",
    "need",
    "only",
    "product",
    "that",
    "than",
    "this",
    "under",
    "want",
    "with",
    "without",
    "works",
]);

function officialListingFitScore(
    title: string,
    features: string[] | undefined,
    query: string,
): number {
    const normalizedTitle = normalizedWords(title);
    const normalizedEvidence = normalizedWords(`${title} ${features?.join(" ") ?? ""}`);
    const tokens = Array.from(
        new Set(
            normalizedWords(query)
                .split(" ")
                .filter(
                    (token) =>
                        token.length >= 3 &&
                        !RANKING_STOP_WORDS.has(token) &&
                        !/^\d+$/.test(token),
                ),
        ),
    );
    let evidenceScore = 0;
    for (const token of tokens) {
        if (normalizedTitle.includes(token)) evidenceScore += 5;
        else if (normalizedEvidence.includes(token)) evidenceScore += 2;
    }
    return exactTitleFitScore(normalizedEvidence, query) + evidenceScore;
}

function compareOfficialCandidates(
    left: EnrichedProductRow,
    right: EnrichedProductRow,
    query: string,
): number {
    const relevanceDifference =
        officialListingFitScore(
            right.title,
            right.features,
            query,
        ) -
        officialListingFitScore(
            left.title,
            left.features,
            query,
        );
    if (relevanceDifference !== 0) return relevanceDifference;

    const leftPrice = parseOfficialPrice(left.priceEstimate);
    const rightPrice = parseOfficialPrice(right.priceEstimate);
    if (leftPrice !== null && rightPrice !== null && leftPrice !== rightPrice) {
        return leftPrice - rightPrice;
    }
    if (leftPrice !== null && rightPrice === null) return -1;
    if (leftPrice === null && rightPrice !== null) return 1;
    return compareDeterministicListingIdentity(left.asin, right.asin);
}

function buildAmazonDiscoveryQuery(query: string): string {
    return query
        .replace(
            /\b(?:under|below|less than|up to|no more than|at most)\s*\$\s*[\d,]+(?:\.\d{1,2})?/gi,
            " ",
        )
        .replace(/\b(?:no|without)\s+(?:a\s+)?(?:numpad|number pad|numeric keypad)\b/gi, "tenkeyless TKL")
        .replace(/\bquiet\b/gi, "quiet silent")
        .replace(/\bworks with\b/gi, "compatible with")
        .replace(/\bworks without (?:the )?internet\b/gi, "no WiFi remote control")
        .replace(/\bnot\s+(?:renewed|refurbished|used|barebones?)\b/gi, " ")
        .replace(/\bfor a shared office\b/gi, "office")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 220);
}

function buildFocusedAmazonQuery(query: string): string {
    const normalized = normalizedWords(query);
    const rawQuery = query.toLowerCase();
    const minimumWattage = extractMinimumWattage(query);
    if (/\bmonitor\b/.test(normalized) && minimumWattage !== null) {
        return `${minimumWattage}W USB-C power delivery monitor MacBook`;
    }
    if (
        /\brobot vacuum\b/.test(normalized) &&
        /\b(?:without internet|no wifi|no wi fi|offline)\b/.test(normalized)
    ) {
        return "robot vacuum pet hair remote control no WiFi";
    }
    if (/\bnoise cancel(?:ing|ling) headphones\b/.test(normalized)) {
        return "wireless active noise cancelling headphones travel";
    }
    if (
        /\bants?\b/.test(normalized) &&
        /\b(?:traps?|baits?|bait stations?|stations?)\b/.test(normalized)
    ) {
        return "indoor ant bait stations ant traps";
    }
    if (
        /\b75\s*(?:%|percent)\b/.test(rawQuery) &&
        /\bhot swappable mechanical keyboard\b/.test(normalized)
    ) {
        return "complete 75% hot swappable mechanical keyboard";
    }
    return buildAmazonDiscoveryQuery(query);
}

function buildQualityAmazonQuery(query: string): string {
    // These brand-expanded fallback phrases are discovery-only recall aids.
    // Brand identity does not receive ranking merit.
    const normalized = normalizedWords(query);
    const rawQuery = query.toLowerCase();
    const minimumWattage = extractMinimumWattage(query);
    if (/\bnoise cancel(?:ing|ling) headphones\b/.test(normalized)) {
        return "Sennheiser Soundcore JBL Sony wireless noise cancelling headphones";
    }
    if (/\bmonitor\b/.test(normalized) && minimumWattage !== null) {
        return `LG Dell Samsung ${minimumWattage}W USB-C monitor`;
    }
    if (/\brobot vacuum\b/.test(normalized)) {
        return "ILIFE eufy robot vacuum pet hair remote control";
    }
    if (
        /\bmechanical keyboard\b/.test(normalized) &&
        /\bquiet\b/.test(normalized)
    ) {
        return "Keychron silent mechanical keyboard TKL Mac Windows";
    }
    if (
        /\b75\s*(?:%|percent)\b/.test(rawQuery) &&
        /\bhot swappable mechanical keyboard\b/.test(normalized)
    ) {
        return "Keychron Royal Kludge 75% hot swappable mechanical keyboard";
    }
    return buildFocusedAmazonQuery(query);
}

function filterVerifiedRows(
    rows: EnrichedProductRow[],
    query: string,
    options: { dedupeVariants?: boolean; limit?: number } = {},
): EnrichedProductRow[] {
    const ceiling = extractPriceCeiling(query);
    const seen = new Set<string>();
    const seenVariants = new Set<string>();
    const dedupeVariants = options.dedupeVariants ?? true;
    return rows
        .filter((row) => {
            if (!row.verified || !/^[A-Z0-9]{10}$/i.test(row.asin)) return false;
            if (seen.has(row.asin)) return false;
            const variantKey = canonicalProductFamilyKey(
                row.title,
                row.brand,
            );
            if (dedupeVariants && seenVariants.has(variantKey)) return false;
            const fits =
                !isUnexpectedListing(
                    row.title,
                    query,
                    row.features,
                    row.condition,
                    row.subCondition,
                ) &&
                fitsPriceCeiling(row.priceEstimate, ceiling);
            if (!fits) return false;
            seen.add(row.asin);
            if (dedupeVariants) seenVariants.add(variantKey);
            return true;
        })
        .sort((a, b) =>
            compareDeterministicListingIdentity(a.asin, b.asin),
        )
        .slice(0, options.limit ?? 8);
}

function amazonProductsToRows(items: AmazonProduct[]): EnrichedProductRow[] {
    return items.map((item, index) => ({
        rank: index + 1,
        title: item.title,
        asin: item.asin,
        parentAsin: item.parentAsin,
        brand: item.brand,
        whyThisPick: "",
        pros: [],
        cons: [],
        priceEstimate: item.price ?? "",
        // Creators API does not currently expose customer ratings.
        rating: 0,
        category: "Amazon result",
        imageUrl: item.imageUrl ?? item.image,
        amazonUrl: item.url,
        fetchedAt: item.fetchedAt,
        features: item.features,
        condition: item.condition,
        subCondition: item.subCondition,
        color: item.color,
        size: item.size,
        unitCount: item.unitCount,
        productGroup: item.productGroup,
        verified: true,
        confidence: "medium",
    }));
}

async function collectOfficialCandidateRows(
    query: string,
    context: SearchContext,
    plannedQueries: string[] = [],
    lookupAsins: string[] = [],
    requireEveryLookupAsin = false,
): Promise<EnrichedProductRow[]> {
    if (lookupAsins.length > 0) {
        const exactItems = await getAmazonItems(lookupAsins, {
            signal: context.signal,
            deadlineAt: context.deadlineAt,
        });
        const byAsin = new Map(
            exactItems.map((item) => [item.asin.toUpperCase(), item]),
        );
        if (
            requireEveryLookupAsin &&
            lookupAsins.some((asin) => !byAsin.has(asin))
        ) {
            return [];
        }
        const ordered = lookupAsins
            .map((asin) => byAsin.get(asin))
            .filter((item): item is AmazonProduct => Boolean(item));
        const filtered = filterAmazonItems(ordered, query, {
            dedupeVariants: false,
        });
        if (
            requireEveryLookupAsin &&
            filtered.length !== lookupAsins.length
        ) {
            return [];
        }
        return filterVerifiedRows(
            amazonProductsToRows(filtered),
            query,
            { dedupeVariants: false, limit: lookupAsins.length },
        );
    }

    const queries = Array.from(
        new Set(
            plannedQueries
                .slice(0, 2)
                .concat(buildFocusedAmazonQuery(query), buildAmazonDiscoveryQuery(query))
                .concat(buildQualityAmazonQuery(query))
                .map((value) => value.trim())
                .filter(Boolean),
        ),
    ).slice(0, MAX_OFFICIAL_SEARCHES);
    const sets = await collectSuccessfulPhraseSets(
        queries,
        async (amazonQuery) =>
            filterAmazonItems(
                await searchAmazon(amazonQuery, {
                    itemCount: AMAZON_RESULTS_PER_SEARCH,
                    signal: context.signal,
                    deadlineAt: context.deadlineAt,
                }),
                query,
                { dedupeVariants: false },
            ),
        (error) =>
            context.signal.aborted ||
            context.deadlineAt <= Date.now() ||
            isFatalAmazonSearchError(error),
    );

    const interleaved: AmazonProduct[] = [];
    const largestSet = Math.max(0, ...sets.map((set) => set.length));
    for (let index = 0; index < largestSet; index += 1) {
        for (const set of sets) {
            const item = set[index];
            if (item) interleaved.push(item);
        }
    }

    const rows = amazonProductsToRows(interleaved);

    return filterVerifiedRows(rows, query, {
        dedupeVariants: false,
        limit: MAX_OFFICIAL_CANDIDATES,
    });
}

async function reconcileVerifiedRows(
    query: string,
    candidates: EnrichedProductRow[],
    options: {
        requiredAsins?: string[];
        allowedAsins?: string[];
        requestMode: "fresh" | "refinement" | "exact-item";
    },
): Promise<{ summary: string; rows: EnrichedProductRow[] } | null> {
    if (candidates.length === 0) return null;
    const requiredAsins = options.requiredAsins ?? [];
    const allowedAsins = new Set(
        (options.allowedAsins ?? []).map((asin) => asin.toUpperCase()),
    );
    const scopedCandidates =
        allowedAsins.size > 0
            ? candidates.filter((candidate) =>
                allowedAsins.has(candidate.asin.toUpperCase()),
            )
            : candidates;

    // Amazon Product Advertising Content must not be sent to an AI provider.
    // The model's only runtime job is query planning. Exact listings are
    // re-filtered and ranked locally from official evidence.
    const rankedRows = filterVerifiedRows(scopedCandidates, query, {
        dedupeVariants: false,
        limit:
            requiredAsins.length > 0
                ? requiredAsins.length
                : scopedCandidates.length,
    }).sort((left, right) =>
        compareOfficialCandidates(left, right, query),
    );
    const familyScopedRows =
        options.requestMode === "fresh"
            ? dedupeRankedProductFamilies(rankedRows)
            : rankedRows;
    const shortlistedRows = familyScopedRows.slice(0, MAX_SHORTLIST_RESULTS);
    const rows = shortlistedRows
        .map((candidate, index) => {
            const strengths = relevantOfficialFeatures(
                candidate.features,
                query,
            );
            const constraintEvaluation = evaluateListingConstraints({
                query,
                title: candidate.title,
                features: candidate.features,
            });
            return {
                ...candidate,
                rank: index + 1,
                whyThisPick: officialEvidenceReason(
                    candidate,
                    options.requestMode,
                    index + 1,
                    constraintEvaluation.unknownClaims,
                ),
                pros: strengths,
                cons: deterministicOfficialTradeoffs(
                    candidate,
                    shortlistedRows,
                    options.requestMode,
                ),
                confidence: calibratedConfidence(
                    options.requestMode,
                    strengths.length,
                ),
                constraintEvidence: constraintEvaluation.decisions,
                unknownConstraints: constraintEvaluation.unknownClaims,
            };
        });

    if (
        rows.length === 0 ||
        requiredAsins.some(
            (asin) =>
                !rows.some((row) => row.asin.toUpperCase() === asin),
        )
    ) {
        return null;
    }
    const summary =
        options.requestMode === "exact-item"
            ? `Verified ${
                rows.length === 1
                    ? "the requested Amazon listing"
                    : `${rows.length} requested Amazon listings`
            } by exact ASIN. No substitute products were used.`
            : options.requestMode === "refinement"
              ? `Re-fetched the prior shortlist by exact ASIN and kept ${rows.length} ${
                  rows.length === 1 ? "listing" : "listings"
              } whose current official listing data did not conflict with the added filter. Unconfirmed details remain labeled on each result. No substitute products were added.`
              : `Found ${rows.length} official Amazon ${
                  rows.length === 1 ? "listing" : "listings"
              } that passed the request's verifiable filters. Unconfirmed details remain labeled on each result. Ranked by direct evidence from the returned listing data.`;
    return {
        summary,
        rows,
    };
}

const FEATURE_STOP_WORDS = new Set([
    "and",
    "are",
    "for",
    "from",
    "amazon",
    "best",
    "find",
    "headphone",
    "headphones",
    "keyboard",
    "keyboards",
    "listing",
    "monitor",
    "no",
    "not",
    "only",
    "product",
    "results",
    "vacuum",
    "that",
    "the",
    "this",
    "under",
    "with",
    "without",
    "works",
]);

const FEATURE_TOKEN_ALIASES: Record<string, string[]> = {
    ant: ["ants"],
    ants: ["ant"],
    canceling: ["cancelling", "cancellation", "anc"],
    cancelling: ["canceling", "cancellation", "anc"],
    complete: ["full", "assembled", "preassembled", "preinstalled"],
    flight: ["flights", "airplane", "travel", "traveling"],
    flights: ["flight", "airplane", "travel", "traveling"],
    indoor: ["indoors"],
    indoors: ["indoor"],
    mac: ["macos", "macbook"],
    numpad: ["keypad", "tenkeyless", "tkl"],
    quiet: ["silent"],
    station: ["stations", "trap", "traps"],
    stations: ["station", "trap", "traps"],
    trap: ["traps", "station", "stations"],
    traps: ["trap", "station", "stations"],
    wireless: ["bluetooth"],
};
const EXPOSED_OFFICIAL_FEATURE_LIMIT = 8;

function featureHasQueryToken(
    featureTokens: Set<string>,
    queryToken: string,
): boolean {
    if (featureTokens.has(queryToken)) return true;
    return (FEATURE_TOKEN_ALIASES[queryToken] ?? []).some((alias) =>
        featureTokens.has(alias),
    );
}

function firstPositiveOfficialFeatureClause(feature: string): string {
    for (const { value, order } of splitOfficialFeatureClauses([feature])) {
        if (!classifyOfficialTradeoff(value, order)) return value;
    }
    return "";
}

function relevantOfficialFeatures(
    features: string[] | undefined,
    query: string,
    limit = 3,
): string[] {
    if (!features?.length) return [];
    const queryTokens = new Set(
        normalizedWords(query)
            .split(" ")
            .filter((token) => token.length >= 3 && !FEATURE_STOP_WORDS.has(token)),
    );
    return features
        .slice(0, EXPOSED_OFFICIAL_FEATURE_LIMIT)
        .map((feature, index) => {
            // A source clause cannot honestly be both a strength and a
            // trade-off. Keep a positive clause from a mixed official bullet.
            const firstSentence = firstPositiveOfficialFeatureClause(feature)
                .split(/(?<=[.!?])\s+/)[0]
                .trim();
            const excerpt = firstSentence.length > 220
                ? `${firstSentence.slice(0, 217).trimEnd()}…`
                : firstSentence;
            const featureTokens = new Set(
                normalizedWords(excerpt).split(" ").filter(Boolean),
            );
            let score = 0;
            for (const token of queryTokens) {
                if (featureHasQueryToken(featureTokens, token)) score += 1;
            }
            return { feature: excerpt, index, score };
        })
        .filter(({ score }) => score > 0)
        .sort((left, right) => right.score - left.score || left.index - right.index)
        .slice(0, limit)
        .map(({ feature }) => feature);
}

interface OfficialTradeoffCandidate {
    category: "excluded" | "availability" | "capability" | "requirement";
    priority: number;
    order: number;
    text: string;
}

function splitOfficialFeatureClauses(
    features: string[] | undefined,
): Array<{ value: string; order: number }> {
    if (!features?.length) return [];
    let order = 0;
    const clauses: Array<{ value: string; order: number }> = [];
    for (const feature of features) {
        for (const rawClause of feature.split(
            /(?<=[.!?;])\s+|[|•]+|,\s+(?=(?:[^\s,]+\s+){0,6}(?:(?:sold|purchased)\s+separately|not\s+included|unavailable|not\s+available|unsupported|not\s+supported|(?:only|exclusively)\s+(?:supports?|works?|compatible|available|operates?|functions?)|(?:windows|mac(?:os)?|ios|android|wired|wireless|bluetooth)\s+only|not\s+(?:fully\s+|completely\s+|entirely\s+)?(?:effective|silent|waterproof|compatible|suitable|recommended)|(?:does\s+not|doesn['’]t|cannot|can['’]t|won['’]t|will\s+not)\s+(?:work|operate|function|fit|connect|pair|charge|support|sync)|requires?|needs?|must|(?:is|are)\s+required)\b)|\s+(?:but|however|though|although)\s+/i,
        )) {
            const value = rawClause
                .replace(/\s+/g, " ")
                .replace(/^[\s:;,\-–—]+|[\s:;,\-–—]+$/g, "")
                .trim();
            if (!value) continue;
            clauses.push({ value, order });
            order += 1;
        }
    }
    return clauses;
}

function conciseOfficialTradeoff(value: string): string {
    const normalized = value.replace(/\s+/g, " ").trim();
    const clipped = normalized.length <= 160
        ? normalized
        : `${normalized.slice(0, 157).replace(/\s+\S*$/, "").trimEnd()}…`;
    const sentence =
        clipped.charAt(0).toUpperCase() + clipped.slice(1);
    return /[.!?…]$/.test(sentence) ? sentence : `${sentence}.`;
}

function isPositiveRequirementNegation(normalizedClause: string): boolean {
    return (
        /\bno\b(?:\s+[a-z0-9]+){0,6}\s+(?:required|needed|necessary)\b/.test(
            normalizedClause,
        ) ||
        /\b(?:does\s+not|doesn\s+t|do\s+not|don\s+t)\s+require\b/.test(
            normalizedClause,
        ) ||
        /\b(?:without\s+(?:the\s+)?need\s+for|no\s+need\s+(?:for|to)|not\s+required)\b/.test(
            normalizedClause,
        ) ||
        /\brequires?\s+(?:no|zero|only|less|minimal)\b/.test(
            normalizedClause,
        )
    );
}

function classifyOfficialTradeoff(
    value: string,
    order: number,
): OfficialTradeoffCandidate | null {
    const normalized = normalizedWords(value);
    if (!normalized) return null;

    if (
        (
            /\b(?:sold|purchased)\s+separately\b|\bnot\s+included\b/.test(
                normalized,
            ) &&
            !/\b(?:harmful|toxic|hazardous|harsh|unwanted|bpa|phthalates?|pesticides?)\b(?:\s+[a-z0-9]+){0,4}\s+(?:(?:is|are)\s+)?not\s+included\b/.test(
                normalized,
            )
        )
    ) {
        return {
            category: "excluded",
            priority: 0,
            order,
            text: conciseOfficialTradeoff(value),
        };
    }

    const hasUnavailableClaim =
        /\b(?:unavailable|not\s+available|unsupported|not\s+supported)\b/.test(
            normalized,
        );
    const hasOnlyLimitation =
        !/\bnot\s+only\b/.test(normalized) &&
        (
            /\b(?:only|exclusively)\s+(?:supports?|works?|compatible|available|operates?|functions?)\b/.test(
                normalized,
            ) ||
            /\b(?:supports?|works?|compatible|available|operates?|functions?)\b(?:\s+[a-z0-9]+){0,6}\s+only\b/.test(
                normalized,
            ) ||
            /\b(?:windows|mac(?:os)?|ios|android|wired|wireless|bluetooth|2\s+4\s+ghz)\s+only\b/.test(
                normalized,
            )
        );
    if (hasUnavailableClaim || hasOnlyLimitation) {
        return {
            category: "availability",
            priority: 1,
            order,
            text: conciseOfficialTradeoff(value),
        };
    }

    if (
        /\bnot\s+(?:fully\s+|completely\s+|entirely\s+)?(?:effective|silent|waterproof|compatible|suitable|recommended)\b/.test(
            normalized,
        ) ||
        /\b(?:does\s+not|doesn\s+t|cannot|can\s+t|won\s+t|will\s+not)\s+(?:work|operate|function|fit|connect|pair|charge|support|sync|be\s+used)\b/.test(
            normalized,
        )
    ) {
        return {
            category: "capability",
            priority: 2,
            order,
            text: conciseOfficialTradeoff(value),
        };
    }

    if (isPositiveRequirementNegation(normalized)) return null;

    if (
        /\b(?:requires?|needs?)\s+(?:(?:an?|the)\s+(?:hub|app|subscription|account|adapter|outlet|connection|installation|download|charger|power\s+supply)|(?:an?\s+)?(?:at\s+least\s+)?\d+(?:\s+\d+)?\s*(?:aa|aaa|batter(?:y|ies)|volts?|watts?|gb|mb|ghz|inches?|feet|hours?)|windows|mac(?:os)?|ios|android|wi\s*fi|bluetooth|hub|app|subscription|account|batter(?:y|ies)|adapter|outlet|connection|assembly|installation|download|charger|power\s+supply|regular\s+(?:cleaning|maintenance|replacement))\b/.test(
            normalized,
        ) ||
        /\bneeds?\s+to\s+(?:remain|stay|connect|pair|charge|install|download|be\s+(?:connected|plugged\s+in|paired|charged|installed|mounted|assembled))\b/.test(
            normalized,
        ) ||
        /\bmust\s+(?:use|have|connect|remain|stay|install|download|purchase|be\s+(?:connected|plugged\s+in|paired|charged|installed|mounted|assembled))\b/.test(
            normalized,
        ) ||
        /\b(?:batter(?:y|ies)|hub|app|subscription|account|internet|wi\s*fi|adapter|charger|power\s+supply|assembly|installation)\s+(?:(?:is|are)\s+)?required\b/.test(
            normalized,
        )
    ) {
        return {
            category: "requirement",
            priority: 3,
            order,
            text: conciseOfficialTradeoff(value),
        };
    }

    return null;
}

function explicitOfficialTradeoffs(features: string[] | undefined): string[] {
    const candidates = splitOfficialFeatureClauses(features)
        .map(({ value, order }) => classifyOfficialTradeoff(value, order))
        .filter(
            (candidate): candidate is OfficialTradeoffCandidate =>
                candidate !== null,
        )
        .sort(
            (left, right) =>
                left.priority - right.priority || left.order - right.order,
        );
    const seenCategories = new Set<OfficialTradeoffCandidate["category"]>();
    const seenText = new Set<string>();
    const tradeoffs: string[] = [];
    for (const candidate of candidates) {
        const normalizedText = normalizedWords(candidate.text);
        if (
            seenCategories.has(candidate.category) ||
            seenText.has(normalizedText)
        ) {
            continue;
        }
        seenCategories.add(candidate.category);
        seenText.add(normalizedText);
        tradeoffs.push(candidate.text);
        if (tradeoffs.length >= 2) break;
    }
    return tradeoffs;
}

function formatOfficialPrice(value: number): string {
    return `$${value.toFixed(2)}`;
}

function deterministicOfficialTradeoffs(
    product: EnrichedProductRow,
    shortlist: EnrichedProductRow[],
    requestMode: "fresh" | "refinement" | "exact-item",
): string[] {
    const explicit = explicitOfficialTradeoffs(
        product.features?.slice(0, EXPOSED_OFFICIAL_FEATURE_LIMIT),
    );
    if (explicit.length > 0) return explicit.slice(0, 2);
    if (requestMode === "exact-item" || shortlist.length < 2) return [];
    if (!product.verified || !product.fetchedAt) return [];

    const currentPrice = parseOfficialPrice(product.priceEstimate);
    const shortlistPrices = shortlist
        .filter((row) => row.verified && Boolean(row.fetchedAt))
        .map((row) => parseOfficialPrice(row.priceEstimate))
        .filter((price): price is number => price !== null);
    if (currentPrice === null || shortlistPrices.length < 2) return [];

    const lowestPrice = Math.min(...shortlistPrices);
    const delta = currentPrice - lowestPrice;
    if (delta < 0.01) return [];

    return [
        `Current listed price is ${formatOfficialPrice(currentPrice)}, ${formatOfficialPrice(delta)} above the shortlist low of ${formatOfficialPrice(lowestPrice)}.`,
    ];
}

function officialEvidenceReason(
    product: EnrichedProductRow,
    requestMode: "fresh" | "refinement" | "exact-item",
    rank: number,
    unknownConstraints: string[] = [],
): string {
    const uncertainty =
        unknownConstraints.length > 0
            ? ` The listing did not confirm ${unknownConstraints.join(
                ", ",
            )}; confirm that detail on Amazon.`
            : "";
    if (requestMode === "exact-item") {
        return `Amazon's official product API returned requested ASIN ${product.asin}. No substitute listing was used.${uncertainty}`;
    }
    if (requestMode === "refinement") {
        return `Prior-list ASIN ${product.asin} was re-fetched directly. Its current official listing data did not conflict with the added filter.${uncertainty}`;
    }
    return `Ranked #${rank} by direct match between the request and current official listing evidence.${uncertainty}`;
}

function calibratedConfidence(
    requestMode: "fresh" | "refinement" | "exact-item",
    relevantEvidenceCount: number,
): "high" | "medium" | "low" {
    if (requestMode === "exact-item") return "high";
    return relevantEvidenceCount > 0 ? "medium" : "low";
}

function oldestOfficialFetch(values: Array<string | undefined>): string | undefined {
    const valid = values
        .filter((value): value is string => typeof value === "string")
        .map((value) => ({ value, time: Date.parse(value) }))
        .filter((entry) => Number.isFinite(entry.time))
        .sort((left, right) => left.time - right.time);
    return valid[0]?.value;
}

function assignShortlistBadges(
    rows: EnrichedProductRow[],
    requestMode: "fresh" | "refinement" | "exact-item",
): Map<string, ProductBadge[]> {
    const badgesByAsin = new Map(
        rows.map((row) => [row.asin, [] as ProductBadge[]]),
    );
    if (requestMode === "exact-item" || rows.length < 2) {
        return badgesByAsin;
    }

    const addBadge = (asin: string, badge: ProductBadge) => {
        badgesByAsin.get(asin)?.push(badge);
    };
    if (rows[0].confidence !== "low") {
        addBadge(rows[0].asin, {
            kind: "best-overall",
            label: PRODUCT_BADGE_LABELS["best-overall"],
            scope: PRODUCT_BADGE_SCOPE,
            evidence: `Highest-ranked match among the ${rows.length} current official-data listings returned for this search. This is a relative shortlist label, not a claim that it is best across Amazon.`,
        });
    }
    if (rows[1].confidence !== "low") {
        addBadge(rows[1].asin, {
            kind: "runner-up",
            label: PRODUCT_BADGE_LABELS["runner-up"],
            scope: PRODUCT_BADGE_SCOPE,
            evidence: `Second-highest match among the ${rows.length} current official-data listings returned for this search.`,
        });
    }
    // Only fresh searches pass through family dedupe. Refinements and exact
    // lookups therefore must not claim that a sibling is a distinct family.
    if (
        requestMode === "fresh" &&
        rows.length >= 3 &&
        rows[2].confidence !== "low"
    ) {
        addBadge(rows[2].asin, {
            kind: "strong-alternative",
            label: PRODUCT_BADGE_LABELS["strong-alternative"],
            scope: PRODUCT_BADGE_SCOPE,
            evidence: `Next distinct product family after the two highest-ranked matches in this current official-data shortlist.`,
        });
    }

    const pricedRows = rows
        .map((row) => ({
            row,
            price: row.verified && row.fetchedAt
                ? parseOfficialPrice(row.priceEstimate)
                : null,
        }))
        .filter(
            (
                entry,
            ): entry is { row: EnrichedProductRow; price: number } =>
                entry.price !== null,
        );
    const distinctPrices = new Set(pricedRows.map(({ price }) => price));
    if (pricedRows.length >= 2 && distinctPrices.size >= 2) {
        const lowestPrice = Math.min(
            ...pricedRows.map(({ price }) => price),
        );
        const cheapest = pricedRows.filter(
            ({ price }) => price === lowestPrice,
        );
        for (const { row } of cheapest) {
            addBadge(row.asin, {
                kind: "best-price",
                label: PRODUCT_BADGE_LABELS["best-price"],
                scope: PRODUCT_BADGE_SCOPE,
                evidence:
                    cheapest.length > 1
                        ? `Tied for the lowest current listed item price among ${pricedRows.length} priced matches; shipping, tax, coupons, and membership terms excluded.`
                        : `Lowest current listed item price among ${pricedRows.length} priced matches; shipping, tax, coupons, and membership terms excluded.`,
            });
        }
    }

    return badgesByAsin;
}

function buildAiRankedResponse(
    reconciled: { summary: string; rows: EnrichedProductRow[] },
    queryPlan: QueryPlan,
    requestMode: "fresh" | "refinement" | "exact-item",
) {
    const fetchedAt = oldestOfficialFetch(
        reconciled.rows.map((product) => product.fetchedAt),
    );
    const badgesByAsin = assignShortlistBadges(
        reconciled.rows,
        requestMode,
    );
    return {
        summary: reconciled.summary,
        products: reconciled.rows.map((product) => ({
            rank: product.rank,
            title: product.title,
            asin: product.asin,
            whyThisPick: product.whyThisPick,
            pros: product.pros,
            cons: product.cons,
            priceEstimate: product.verified ? product.priceEstimate : "",
            rating: product.verified ? product.rating : 0,
            category: product.category,
            imageUrl: product.verified ? product.imageUrl : undefined,
            amazonUrl: product.verified ? product.amazonUrl : undefined,
            fetchedAt: product.verified ? product.fetchedAt : undefined,
            reviewCount: product.verified ? product.reviewCount : undefined,
            condition: product.verified ? product.condition : undefined,
            subCondition: product.verified ? product.subCondition : undefined,
            officialFeatures: product.features?.slice(
                0,
                EXPOSED_OFFICIAL_FEATURE_LIMIT,
            ),
            verified: product.verified,
            tier: product.tier,
            confidence: product.confidence,
            constraintEvidence: product.constraintEvidence,
            unknownConstraints: product.unknownConstraints,
            badges: badgesByAsin.get(product.asin) ?? [],
        })),
        enriched: true,
        fetchedAt,
        mode: "ai-ranked" as const,
        meta: {
            model: queryPlan.model,
            cached: queryPlan.cached,
            grounded: false,
            reconciled: true,
            queryPlannerModel: queryPlan.model,
            queryPlannerCached: queryPlan.cached,
            queryPlannerInputTokens: queryPlan.inputTokens,
            queryPlannerOutputTokens: queryPlan.outputTokens,
            amazonContentSentToAi: false,
            ranking: "deterministic-official-evidence",
            requestMode,
            badgeRulesVersion: 1,
            badgeScope: PRODUCT_BADGE_SCOPE,
        },
    };
}

export async function POST(req: NextRequest) {
    const ip =
        req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip")?.trim() ||
        "unknown";
    const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) {
        return Response.json(
            { error: "Send this search as JSON." },
            { status: 415, headers: CORS },
        );
    }
    const declaredLength = Number(req.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
        return Response.json(
            { error: "That search request is too large." },
            { status: 413, headers: CORS },
        );
    }

    const startTime = Date.now();
    const context: SearchContext = {
        signal: AbortSignal.any([
            req.signal,
            AbortSignal.timeout(SEARCH_DEADLINE_MS),
        ]),
        deadlineAt: startTime + SEARCH_DEADLINE_MS,
    };
    let userQuery = "";
    let fallbackIntent = "";

    try {
            const rawBody = await raceWithSearchDeadline(
                req.text(),
                context,
            );
            if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
                return Response.json(
                    { error: "That search request is too large." },
                    { status: 413, headers: CORS },
                );
            }

            let requestBody: unknown;
            try {
                requestBody = JSON.parse(rawBody);
            } catch {
                return Response.json(
                    { error: "Send a valid JSON search request." },
                    { status: 400, headers: CORS },
                );
            }
            if (!requestBody || typeof requestBody !== "object") {
                return Response.json(
                    { error: "Please enter a valid search query." },
                    { status: 400, headers: CORS },
                );
            }

            const safeBody = requestBody as Record<string, unknown>;
            const safeMessages = safeBody.messages;
            if (
                !Array.isArray(safeMessages) ||
                safeMessages.length !== 1 ||
                !safeMessages[0] ||
                typeof safeMessages[0] !== "object"
            ) {
                return Response.json(
                    { error: "Send exactly one user search message." },
                    { status: 400, headers: CORS },
                );
            }
            const safeMessage = safeMessages[0] as Record<string, unknown>;
            if (
                safeMessage.role !== "user" ||
                typeof safeMessage.content !== "string"
            ) {
                return Response.json(
                    { error: "Only a user search message is accepted." },
                    { status: 400, headers: CORS },
                );
            }

            userQuery = safeMessage.content.trim();
            if (
                userQuery.length === 0 ||
                userQuery.length > MAX_QUERY_CHARACTERS
            ) {
                return Response.json(
                    {
                        error:
                            userQuery.length > MAX_QUERY_CHARACTERS
                                ? "Keep your search to 500 characters or fewer."
                                : "Please enter a valid search query.",
                    },
                    { status: 400, headers: CORS },
                );
            }

            const safeOriginal =
                typeof safeBody.originalQuery === "string"
                    ? safeBody.originalQuery.trim()
                    : "";
            if (
                safeOriginal.length >
                MAX_REFINEMENT_CONTEXT_CHARACTERS
            ) {
                return Response.json(
                    {
                        error:
                            "This refinement chain is too long. Start a fresh search with the requirements that still matter.",
                        code: "REFINEMENT_INTENT_TOO_LONG",
                    },
                    { status: 400, headers: CORS },
                );
            }
            if (
                safeBody.priorProducts !== undefined &&
                (
                    !Array.isArray(safeBody.priorProducts) ||
                    safeBody.priorProducts.length > MAX_SHORTLIST_RESULTS
                )
            ) {
                return Response.json(
                    {
                        error: `A refinement can include at most ${MAX_SHORTLIST_RESULTS} prior products.`,
                    },
                    { status: 400, headers: CORS },
                );
            }
            const priorProducts: PriorProduct[] = [];
            const priorAsins = new Set<string>();
            if (Array.isArray(safeBody.priorProducts)) {
                for (const prior of safeBody.priorProducts) {
                    const record =
                        prior && typeof prior === "object"
                            ? prior as Record<string, unknown>
                            : null;
                    const asin =
                        typeof record?.asin === "string"
                            ? record.asin.trim().toUpperCase()
                            : "";
                    const title =
                        typeof record?.title === "string"
                            ? record.title.trim()
                            : "";
                    if (
                        !record ||
                        !/^[A-Z0-9]{10}$/.test(asin) ||
                        title.length === 0 ||
                        title.length > 300 ||
                        priorAsins.has(asin)
                    ) {
                        return Response.json(
                            { error: "The prior product list is invalid." },
                            { status: 400, headers: CORS },
                        );
                    }
                    priorAsins.add(asin);
                    priorProducts.push({ asin, title });
                }
            }
            if (priorProducts.length > 0 && safeOriginal.length === 0) {
                return Response.json(
                    {
                        error:
                            "A refinement must include the nonempty original search query.",
                        code: "REFINEMENT_ORIGINAL_QUERY_REQUIRED",
                    },
                    { status: 400, headers: CORS },
                );
            }

            if (isRateLimited(ip)) {
                scheduleRejectedSearchLog("RATE_LIMITED", {
                    ip,
                    resultCount: 0,
                    enrichedCount: 0,
                    durationMs: Date.now() - startTime,
                });
                return Response.json(
                    {
                        error: "Too many searches. Please wait a minute and try again.",
                        code: "RATE_LIMITED",
                        retryAfterSeconds: 60,
                    },
                    {
                        status: 429,
                        headers: { ...CORS, "Retry-After": "60" },
                    },
                );
            }
            const budget = await raceWithSearchDeadline(
                takeSearchBudget(ip),
                context,
            );
            if (!budget.allowed) {
                const retryAfterSeconds = Math.max(
                    1,
                    budget.retryAfterSeconds,
                );
                if (budget.reason === "infrastructure_unavailable") {
                    scheduleRejectedSearchLog(
                        "CAPACITY_CHECK_UNAVAILABLE",
                        {
                            ip,
                            resultCount: 0,
                            enrichedCount: 0,
                            durationMs: Date.now() - startTime,
                        },
                    );
                    return Response.json(
                        {
                            error:
                                "Search is temporarily unavailable while capacity checks recover. Please try again shortly.",
                            code: "CAPACITY_CHECK_UNAVAILABLE",
                            retryAfterSeconds,
                        },
                        {
                            status: 503,
                            headers: {
                                ...CORS,
                                "Retry-After": String(retryAfterSeconds),
                            },
                        },
                    );
                }
                const daily = budget.reason === "daily_budget";
                const code = daily
                    ? "DAILY_CAPACITY_REACHED"
                    : "RATE_LIMITED";
                scheduleRejectedSearchLog(code, {
                    ip,
                    resultCount: 0,
                    enrichedCount: 0,
                    durationMs: Date.now() - startTime,
                });
                return Response.json(
                    {
                        error: daily
                            ? "Today's search capacity has been reached. Please try again tomorrow."
                            : "Too many searches. Please wait a minute and try again.",
                        code,
                        retryAfterSeconds,
                    },
                    {
                        status: 429,
                        headers: {
                            ...CORS,
                            "Retry-After": String(retryAfterSeconds),
                        },
                    },
                );
            }

            const isSafeRefinement = priorProducts.length > 0;
            const searchIntent = combineSearchIntent([
                isSafeRefinement && safeOriginal
                    ? safeOriginal
                    : null,
                userQuery,
            ]);
            if (
                searchIntent.length >
                MAX_REFINEMENT_CONTEXT_CHARACTERS
            ) {
                return Response.json(
                    {
                        error:
                            "This refinement chain is too long. Start a fresh search with the requirements that still matter.",
                        code: "REFINEMENT_INTENT_TOO_LONG",
                    },
                    { status: 400, headers: CORS },
                );
            }
            fallbackIntent = searchIntent;

            // A refinement's ASIN selection comes only from the new message.
            // The original query remains constraint context and must never
            // silently select or deselect a prior product.
            const exactAsins = extractRequestedAsins(userQuery);
            if (exactAsins.length > 5) {
                return Response.json(
                    { error: "Compare at most five exact Amazon products at a time." },
                    { status: 400, headers: CORS },
                );
            }
            if (
                isSafeRefinement &&
                exactAsins.some((asin) => !priorAsins.has(asin))
            ) {
                return Response.json(
                    {
                        error:
                            "An exact product refinement can only keep items from the prior shortlist.",
                        code: "EXACT_ITEM_NOT_IN_PRIOR_SHORTLIST",
                    },
                    { status: 422, headers: CORS },
                );
            }
            const requestMode: "fresh" | "refinement" | "exact-item" =
                isSafeRefinement
                    ? "refinement"
                    : exactAsins.length > 0
                      ? "exact-item"
                      : "fresh";
            const queryPlan: QueryPlan = requestMode !== "fresh"
                ? {
                    amazonQueries: [],
                    model:
                        requestMode === "refinement"
                            ? "refinement-creators-get-items"
                            : "exact-creators-get-items",
                    cached: false,
                    inputTokens: 0,
                    outputTokens: 0,
                }
                : await buildQueryPlan(searchIntent, context);
            const lookupAsins = isSafeRefinement
                ? exactAsins.length > 0
                    ? exactAsins
                    : priorProducts.map((product) => product.asin)
                : exactAsins;
            let officialRows = await collectOfficialCandidateRows(
                searchIntent,
                context,
                queryPlan.amazonQueries,
                lookupAsins,
                requestMode === "exact-item" ||
                    (requestMode === "refinement" && exactAsins.length > 0),
            );
            if (isSafeRefinement) {
                officialRows = officialRows.filter(
                    (row) =>
                        priorAsins.has(row.asin.toUpperCase()) &&
                        (
                            exactAsins.length === 0 ||
                            exactAsins.includes(row.asin.toUpperCase())
                        ),
                );
            }
            const reconciled = await reconcileVerifiedRows(
                searchIntent,
                officialRows,
                {
                    requestMode,
                    allowedAsins: isSafeRefinement
                        ? [...priorAsins]
                        : undefined,
                    requiredAsins:
                        requestMode === "exact-item" ||
                        (
                            requestMode === "refinement" &&
                            exactAsins.length > 0
                        )
                            ? exactAsins
                            : undefined,
                },
            );
            if (!reconciled) {
                const code =
                    requestMode === "exact-item"
                        ? "EXACT_ITEM_NOT_VERIFIED"
                        : requestMode === "refinement"
                          ? "NO_REFINEMENT_MATCH"
                          : "NO_VERIFIED_MATCH";
                const error =
                    requestMode === "exact-item"
                        ? "The exact Amazon item did not provide enough official listing evidence for this request. No substitute was returned."
                        : requestMode === "refinement"
                          ? "None of the re-fetched prior products had enough official listing evidence for the refinement. No substitute was added."
                          : "No official listings had enough evidence for the request's explicit filters. Try changing one detail.";
                const fallbackAsin = exactAsins[0];
                const safeFallbackIntent = fallbackIntent || userQuery;
                scheduleSearchLog({
                    query: userQuery,
                    ip,
                    resultCount: 0,
                    enrichedCount: 0,
                    durationMs: Date.now() - startTime,
                    error: code,
                });
                return Response.json(
                    {
                        error,
                        code,
                        fallback: fallbackAsin
                            ? {
                                kind: "product",
                                asin: fallbackAsin,
                                amazonUrl: buildAffiliateUrl(fallbackAsin),
                            }
                            : {
                                kind: "search",
                                query: safeFallbackIntent,
                                amazonUrl:
                                    buildAffiliateSearchUrl(safeFallbackIntent),
                            },
                    },
                    { status: 422, headers: CORS },
                );
            }

            const response = buildAiRankedResponse(
                reconciled,
                queryPlan,
                requestMode,
            );
            scheduleSearchLog({
                query: userQuery,
                ip,
                resultCount: response.products.length,
                enrichedCount: response.products.length,
                durationMs: Date.now() - startTime,
            });
            return Response.json(response, { headers: CORS });

    } catch (error: unknown) {
        console.error("Search error:", error);
        const msg = error instanceof Error ? error.message : "";

        // Log the error (fire-and-forget)
        scheduleErrorLog({
            route: "/api/search",
            error: msg || "Unknown search error",
            ip,
            extra: { query: userQuery },
        });
        const recordFailure = (code: string) => {
            if (!userQuery) return;
            scheduleSearchLog({
                query: userQuery,
                ip,
                resultCount: 0,
                enrichedCount: 0,
                durationMs: Date.now() - startTime,
                error: code,
            });
        };

        if (req.signal.aborted) {
            recordFailure("SEARCH_CANCELLED");
            return Response.json(
                {
                    error: "Search canceled.",
                    code: "SEARCH_CANCELLED",
                },
                { status: 499, headers: CORS },
            );
        }
        if (isSearchDeadlineError(error)) {
            recordFailure("SEARCH_DEADLINE_EXCEEDED");
            return Response.json(
                {
                    error:
                        "This search reached its time limit before every listing could be verified. Please try again.",
                    code: "SEARCH_DEADLINE_EXCEEDED",
                    retryAfterSeconds: 2,
                },
                {
                    status: 504,
                    headers: { ...CORS, "Retry-After": "2" },
                },
            );
        }
        if (
            /busy|queue is full|shared request queue|429|throttl|too many requests/i.test(
                msg,
            )
        ) {
            recordFailure("AMAZON_VERIFICATION_BUSY");
            return Response.json(
                {
                    error:
                        "Amazon verification is busy right now. Please try again shortly.",
                    code: "AMAZON_VERIFICATION_BUSY",
                    retryAfterSeconds: 3,
                },
                {
                    status: 503,
                    headers: { ...CORS, "Retry-After": "3" },
                },
            );
        }
        if (isAmazonAccessUnavailableError(error)) {
            recordFailure("AMAZON_ACCESS_UNAVAILABLE");
            const exactAsin = extractRequestedAsins(userQuery)[0];
            const safeFallbackIntent = fallbackIntent || userQuery;
            return Response.json(
                {
                    error:
                        "ProductFindAI cannot access Amazon’s official product catalog right now, so no products were verified for this search.",
                    code: "AMAZON_ACCESS_UNAVAILABLE",
                    fallback: exactAsin
                        ? {
                            kind: "product",
                            asin: exactAsin,
                            amazonUrl: buildAffiliateUrl(exactAsin),
                        }
                        : {
                            kind: "search",
                            query: safeFallbackIntent,
                            amazonUrl:
                                buildAffiliateSearchUrl(safeFallbackIntent),
                        },
                },
                {
                    status: 503,
                    headers: CORS,
                },
            );
        }
        if (msg.includes("API key")) {
            recordFailure("QUERY_PLANNER_UNAVAILABLE");
            return Response.json(
                {
                    error: "Google AI API key not configured.",
                    code: "QUERY_PLANNER_UNAVAILABLE",
                },
                { status: 500, headers: CORS },
            );
        }
        recordFailure("INTERNAL_SEARCH_ERROR");
        return Response.json(
            {
                error: "Search failed. Please try again.",
                code: "INTERNAL_SEARCH_ERROR",
            },
            { status: 500, headers: CORS },
        );
    }
}
