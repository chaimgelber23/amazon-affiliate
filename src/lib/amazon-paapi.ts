// ============================================================================
// PureFind — Amazon Product Advertising API 5.0 client
// ============================================================================
//
// This replaces the former HTML scraper (`amazon-lookup.ts`, now renamed to
// `amazon-lookup.legacy.ts`). Scraping Amazon is a direct violation of
// Associates Operating Agreement §5 ("you will not use any data mining, robots,
// screen scraping, or similar data gathering and extraction tools"). One
// complaint = Associates ban = business over.
//
// What this module does:
//   • `searchAmazon(keyword, options)` — calls PA-API 5.0 SearchItems and
//     returns a normalized `AmazonProduct[]` shape that matches what callers
//     previously got back from the scraper's `lookupProduct()`.
//   • 24h Supabase cache on sha256(query|searchIndex|itemCount).
//   • In-memory rate limiter (≤1 TPS) and 2s retry on 429.
//   • Throws a loud, explicit error if credentials aren't configured —
//     NEVER falls back to scraping.
//
// Env vars required:
//   AMAZON_PAAPI_ACCESS_KEY    — from affiliate-program.amazon.com/assoc_credentials/home
//   AMAZON_PAAPI_SECRET_KEY    — same page
//   AMAZON_PAAPI_PARTNER_TAG   — your Associates tracking tag (e.g. "purefind-20")
//   AMAZON_PAAPI_HOST          — optional, default "webservices.amazon.com"
//   AMAZON_PAAPI_REGION        — optional, default "us-east-1"
//
// See docs/amazon-paapi-setup.md for step-by-step credential provisioning.
// ============================================================================

import crypto from "node:crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// The wrapper has no types shipped; we use a minimal shape-preserving any.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const amazonPaapi: any = require("amazon-paapi");

// ── Public types (match the old amazon-lookup shape) ─────────────────────────

export interface AmazonProduct {
    asin: string;
    title: string;
    price?: string;
    image?: string;         // new canonical name
    imageUrl?: string;      // legacy alias, kept for existing callers
    rating?: number;
    reviewCount?: number;
    url: string;
    prime?: boolean;
}

export interface SearchOptions {
    /** Amazon SearchIndex (e.g. "All", "Electronics", "Books"). Default "All". */
    searchIndex?: string;
    /** Number of items to return (1-10). Default 10. */
    itemCount?: number;
    /** Override partner tag if you want a different one per-call. */
    partnerTag?: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_HOST = "webservices.amazon.com";
const DEFAULT_REGION = "us-east-1";
const CACHE_TTL_HOURS = 24;

function getCreds() {
    const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
    const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
    const partnerTag =
        process.env.AMAZON_PAAPI_PARTNER_TAG ??
        process.env.NEXT_PUBLIC_AMAZON_TAG;
    const host = process.env.AMAZON_PAAPI_HOST ?? DEFAULT_HOST;
    const region = process.env.AMAZON_PAAPI_REGION ?? DEFAULT_REGION;

    if (!accessKey || !secretKey || !partnerTag) {
        throw new Error(
            "PA-API not configured — set AMAZON_PAAPI_ACCESS_KEY/SECRET_KEY/PARTNER_TAG; see docs/amazon-paapi-setup.md",
        );
    }

    return { accessKey, secretKey, partnerTag, host, region };
}

// ── In-memory rate limiter ───────────────────────────────────────────────────
// PA-API enforces 1 TPS by default, scaling up with revenue
// (each ~$0.01 in attributed sales buys ~1 extra request/day, capped at ~8640/day).
// We cap locally at 1 TPS and let 429s bubble up with a single retry.

let lastCallAt = 0;
async function rateLimit() {
    const now = Date.now();
    const wait = Math.max(0, 1100 - (now - lastCallAt)); // 1.1s min gap
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
}

// ── Supabase cache ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any, any, any> | null = null;
function getSupabase() {
    if (_supabase) return _supabase;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    _supabase = createClient(url, key);
    return _supabase;
}

function hashQuery(keyword: string, searchIndex: string, itemCount: number): string {
    const normalized = `${keyword.toLowerCase().trim().replace(/\s+/g, " ")}|${searchIndex}|${itemCount}`;
    return crypto.createHash("sha256").update(normalized).digest("hex");
}

async function getCache(queryHash: string): Promise<AmazonProduct[] | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
    const { data, error } = await sb
        .from("pf_paapi_cache")
        .select("results, created_at")
        .eq("query_hash", queryHash)
        .gte("created_at", cutoff)
        .maybeSingle();
    if (error || !data) return null;
    return (data.results as AmazonProduct[]) ?? null;
}

async function setCache(queryHash: string, query: string, results: AmazonProduct[]): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    // Upsert so repeated lookups refresh the timestamp.
    await sb
        .from("pf_paapi_cache")
        .upsert(
            {
                query_hash: queryHash,
                query: query.slice(0, 500),
                results,
                created_at: new Date().toISOString(),
            },
            { onConflict: "query_hash" },
        )
        .then(({ error }) => {
            if (error) console.warn("[paapi-cache] upsert failed:", error.message);
        });
}

// ── Resource mapping ─────────────────────────────────────────────────────────

const SEARCH_RESOURCES = [
    "ItemInfo.Title",
    "Images.Primary.Large",
    "Images.Primary.Medium",
    "CustomerReviews.StarRating",
    "CustomerReviews.Count",
    "OffersV2.Listings.Price",
    "OffersV2.Listings.DeliveryInfo",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeItem(item: any, partnerTag: string): AmazonProduct | null {
    const asin: string | undefined = item?.ASIN;
    if (!asin || asin.length !== 10) return null;

    const title: string =
        item?.ItemInfo?.Title?.DisplayValue ?? "";

    const image: string | undefined =
        item?.Images?.Primary?.Large?.URL ??
        item?.Images?.Primary?.Medium?.URL ??
        undefined;

    const listing = item?.OffersV2?.Listings?.[0];
    const price: string | undefined =
        listing?.Price?.DisplayAmount ??
        listing?.Price?.SavingBasis?.DisplayAmount ??
        undefined;
    const prime: boolean | undefined =
        listing?.DeliveryInfo?.IsPrimeEligible ?? undefined;

    const ratingRaw = item?.CustomerReviews?.StarRating?.Value;
    const rating = typeof ratingRaw === "number" ? ratingRaw : undefined;
    const reviewRaw = item?.CustomerReviews?.Count;
    const reviewCount = typeof reviewRaw === "number" ? reviewRaw : undefined;

    // Always construct the URL ourselves so the partner tag is guaranteed.
    const url = `https://www.amazon.com/dp/${asin}/?tag=${encodeURIComponent(partnerTag)}`;

    return {
        asin,
        title: title || asin,
        price,
        image,
        imageUrl: image, // legacy alias
        rating,
        reviewCount,
        url,
        prime,
    };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Search Amazon via Product Advertising API 5.0.
 *
 * - Caches identical calls for 24h in Supabase (`pf_paapi_cache`).
 * - Enforces 1 TPS locally; retries ONCE after 2s on a 429/TooManyRequests.
 * - Throws if PA-API credentials are missing (never silently scrapes).
 *
 * @param keyword  The search query (user's raw input or AI-rewritten title).
 * @param options  See `SearchOptions`.
 * @returns Array of `AmazonProduct`. Empty array if no matches.
 */
export async function searchAmazon(
    keyword: string,
    options: SearchOptions = {},
): Promise<AmazonProduct[]> {
    const trimmed = (keyword ?? "").trim();
    if (!trimmed) return [];

    const creds = getCreds();
    const searchIndex = options.searchIndex ?? "All";
    const itemCount = Math.min(Math.max(options.itemCount ?? 10, 1), 10);
    const partnerTag = options.partnerTag ?? creds.partnerTag;

    const queryHash = hashQuery(trimmed, searchIndex, itemCount);
    const cached = await getCache(queryHash);
    if (cached) return cached;

    const commonParameters = {
        AccessKey: creds.accessKey,
        SecretKey: creds.secretKey,
        PartnerTag: partnerTag,
        PartnerType: "Associates",
        Marketplace: "www.amazon.com",
        Host: creds.host,
        Region: creds.region,
    };

    const requestParameters = {
        Keywords: trimmed,
        SearchIndex: searchIndex,
        ItemCount: itemCount,
        Resources: SEARCH_RESOURCES,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callOnce = async (): Promise<any> => {
        await rateLimit();
        return amazonPaapi.SearchItemsV2(commonParameters, requestParameters);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let response: any;
    try {
        response = await callOnce();
    } catch (err: unknown) {
        if (isThrottleError(err)) {
            await new Promise((r) => setTimeout(r, 2000));
            response = await callOnce();
        } else {
            throw err;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = response?.SearchResult?.Items ?? [];
    const products = items
        .map((it) => normalizeItem(it, partnerTag))
        .filter((p): p is AmazonProduct => p !== null);

    // Fire-and-forget cache write. Don't block response on cache failures.
    setCache(queryHash, trimmed, products).catch(() => {});

    return products;
}

function isThrottleError(err: unknown): boolean {
    if (!err) return false;
    const msg = err instanceof Error ? err.message : String(err);
    if (/429|throttle|TooManyRequests|TooManyRequestsException/i.test(msg)) return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyErr = err as any;
    if (anyErr?.status === 429 || anyErr?.statusCode === 429) return true;
    return false;
}

/**
 * Convenience wrapper that returns only the first (top) result — preserves
 * the old `lookupProduct()` call shape for callers that only need one item.
 */
export async function lookupTopProduct(
    keyword: string,
    options: SearchOptions = {},
): Promise<AmazonProduct | null> {
    const results = await searchAmazon(keyword, { ...options, itemCount: options.itemCount ?? 3 });
    return results[0] ?? null;
}

/**
 * Enrich an array of AI-recommended products with real Amazon data from PA-API.
 * Replacement for the former `enrichProducts()` in amazon-lookup.
 *
 * Lookups run sequentially because the rate limiter is 1 TPS anyway. For
 * 6-8 AI picks that's <10s in the worst case, well under the 25s route cap.
 */
export async function enrichProducts<
    T extends { title: string; asin?: string; [key: string]: unknown },
>(
    products: T[],
    options: SearchOptions = {},
): Promise<(T & { amazonData?: AmazonProduct })[]> {
    const enriched: (T & { amazonData?: AmazonProduct })[] = [];
    for (const p of products) {
        try {
            const top = await lookupTopProduct(p.title, options);
            if (top) {
                enriched.push({
                    ...p,
                    asin: top.asin,
                    // Preserve old merge behavior so existing UI keeps working.
                    priceEstimate:
                        top.price ?? (p as Record<string, unknown>).priceEstimate,
                    rating:
                        top.rating ?? (p as Record<string, unknown>).rating,
                    imageUrl: top.image,
                    reviewCount: top.reviewCount,
                    amazonData: top,
                });
            } else {
                enriched.push({ ...p });
            }
        } catch (err) {
            // Don't let a single failed lookup poison the whole batch.
            console.warn(
                "[paapi] enrichment lookup failed:",
                p.title,
                err instanceof Error ? err.message : err,
            );
            enriched.push({ ...p });
        }
    }
    return enriched;
}
