// ============================================================================
// ProductFindAI - Amazon official product data client
// ============================================================================
//
// Product data must come from Amazon's official APIs only. No scraping, no
// rendered-page extraction, and no guessed Amazon prices or ratings.
//
// Preferred path, per Amazon's current docs: Creators API.
// Fallback path while old credentials still exist: Product Advertising API 5.0.
//
// Env vars for Creators API:
//   AMAZON_CREATORS_API_CREDENTIAL_ID
//   AMAZON_CREATORS_API_CREDENTIAL_SECRET
//   AMAZON_CREATORS_API_CREDENTIAL_VERSION
//   AMAZON_CREATORS_API_PARTNER_TAG      optional; falls back to PAAPI/public tag
//   AMAZON_CREATORS_API_MARKETPLACE      optional; default "www.amazon.com"
//
// Legacy PA-API env vars:
//   AMAZON_PAAPI_ACCESS_KEY
//   AMAZON_PAAPI_SECRET_KEY
//   AMAZON_PAAPI_PARTNER_TAG
//   AMAZON_PAAPI_HOST
//   AMAZON_PAAPI_REGION
// ============================================================================

import crypto from "node:crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// The PA-API wrapper has no types shipped; Creators API uses native fetch.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const amazonPaapi: any = require("amazon-paapi");

export interface AmazonProduct {
    asin: string;
    title: string;
    price?: string;
    image?: string;
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
    url: string;
    prime?: boolean;
    source?: "creators-api" | "pa-api";
}

export interface SearchOptions {
    /** Amazon SearchIndex (e.g. "All", "Electronics", "Books"). Default "All". */
    searchIndex?: string;
    /** Number of items to return (1-10). Default 10. */
    itemCount?: number;
    /** Override partner tag if you want a different one per call. */
    partnerTag?: string;
}

const DEFAULT_MARKETPLACE = "www.amazon.com";
const DEFAULT_PAAPI_HOST = "webservices.amazon.com";
const DEFAULT_PAAPI_REGION = "us-east-1";
const CREATORS_API_BASE_URL = "https://creatorsapi.amazon";

// Amazon's product-content rules cap cached price-bearing API content at 1 hour.
// Since our payload can include price strings, the safe rule is 1 hour for all
// cached official Amazon product content.
const CACHE_TTL_HOURS = 1;
const CACHE_SWEEP_INTERVAL_MS = 15 * 60 * 1000;

const CREATORS_RESOURCES = [
    "itemInfo.title",
    "images.primary.large",
    "images.primary.medium",
    "images.primary.small",
    "offersV2.listings.availability",
    "offersV2.listings.condition",
    "offersV2.listings.isBuyBoxWinner",
    "offersV2.listings.price",
];

const PAAPI_RESOURCES = [
    "ItemInfo.Title",
    "Images.Primary.Large",
    "Images.Primary.Medium",
    "CustomerReviews.StarRating",
    "CustomerReviews.Count",
    "OffersV2.Listings.Price",
    "OffersV2.Listings.DeliveryInfo",
];

interface CreatorsCreds {
    credentialId: string;
    credentialSecret: string;
    credentialVersion: string;
    partnerTag: string;
    marketplace: string;
}

interface PaapiCreds {
    accessKey: string;
    secretKey: string;
    partnerTag: string;
    host: string;
    region: string;
}

function getPartnerTag(): string | undefined {
    return (
        process.env.AMAZON_CREATORS_API_PARTNER_TAG ??
        process.env.AMAZON_PAAPI_PARTNER_TAG ??
        process.env.NEXT_PUBLIC_AMAZON_TAG
    );
}

function getCreatorsCreds(): CreatorsCreds | null {
    const credentialId =
        process.env.AMAZON_CREATORS_API_CREDENTIAL_ID ??
        process.env.AMAZON_CREATORS_API_CLIENT_ID;
    const credentialSecret =
        process.env.AMAZON_CREATORS_API_CREDENTIAL_SECRET ??
        process.env.AMAZON_CREATORS_API_CLIENT_SECRET;
    const credentialVersion =
        process.env.AMAZON_CREATORS_API_CREDENTIAL_VERSION ??
        process.env.AMAZON_CREATORS_API_VERSION;
    const partnerTag = getPartnerTag();

    if (!credentialId || !credentialSecret || !credentialVersion || !partnerTag) {
        return null;
    }

    return {
        credentialId,
        credentialSecret,
        credentialVersion,
        partnerTag,
        marketplace: process.env.AMAZON_CREATORS_API_MARKETPLACE ?? DEFAULT_MARKETPLACE,
    };
}

function getPaapiCreds(): PaapiCreds | null {
    const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
    const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
    const partnerTag = getPartnerTag();

    if (!accessKey || !secretKey || !partnerTag) {
        return null;
    }

    return {
        accessKey,
        secretKey,
        partnerTag,
        host: process.env.AMAZON_PAAPI_HOST ?? DEFAULT_PAAPI_HOST,
        region: process.env.AMAZON_PAAPI_REGION ?? DEFAULT_PAAPI_REGION,
    };
}

function getProductApiConfig():
    | { provider: "creators"; creds: CreatorsCreds }
    | { provider: "paapi"; creds: PaapiCreds } {
    const creators = getCreatorsCreds();
    if (creators) return { provider: "creators", creds: creators };

    const paapi = getPaapiCreds();
    if (paapi) return { provider: "paapi", creds: paapi };

    throw new Error(
        "Amazon product API not configured - set Creators API credentials (preferred) or legacy PA-API credentials; see docs/amazon-paapi-setup.md",
    );
}

let lastCallAt = 0;
async function rateLimit() {
    const now = Date.now();
    const wait = Math.max(0, 1100 - (now - lastCallAt));
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastCallAt = Date.now();
}

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

function hashQuery(
    provider: string,
    keyword: string,
    searchIndex: string,
    itemCount: number,
    marketplace: string,
    partnerTag: string,
): string {
    const normalized = [
        provider,
        keyword.toLowerCase().trim().replace(/\s+/g, " "),
        searchIndex,
        itemCount,
        marketplace,
        partnerTag,
    ].join("|");
    return crypto.createHash("sha256").update(normalized).digest("hex");
}

async function getCache(queryHash: string): Promise<AmazonProduct[] | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const cutoff = cacheCutoffIso();
    const { data, error } = await sb
        .from("pf_paapi_cache")
        .select("results, created_at")
        .eq("query_hash", queryHash)
        .gte("created_at", cutoff)
        .maybeSingle();
    if (error || !data) return null;
    return (data.results as AmazonProduct[]) ?? null;
}

function cacheCutoffIso(): string {
    return new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

let lastCacheSweepAt = 0;

// Best-effort storage hygiene: the read path already refuses stale rows, but
// price-bearing Amazon payloads should not linger in the DB either.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sweepStaleCache(sb: SupabaseClient<any, any, any>): Promise<void> {
    const now = Date.now();
    if (now - lastCacheSweepAt < CACHE_SWEEP_INTERVAL_MS) return;
    lastCacheSweepAt = now;
    const { error } = await sb
        .from("pf_paapi_cache")
        .delete()
        .lt("created_at", cacheCutoffIso());
    if (error) console.warn("[amazon-product-cache] stale sweep failed:", error.message);
}

async function setCache(queryHash: string, query: string, results: AmazonProduct[]): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    sweepStaleCache(sb).catch(() => {});
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
            if (error) console.warn("[amazon-product-cache] upsert failed:", error.message);
        });
}

function firstString(...values: unknown[]): string | undefined {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
    for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
            return Number(value);
        }
    }
    return undefined;
}

function firstBoolean(...values: unknown[]): boolean | undefined {
    for (const value of values) {
        if (typeof value === "boolean") return value;
    }
    return undefined;
}

function taggedAmazonUrl(
    rawUrl: string | undefined,
    asin: string,
    partnerTag: string,
    marketplace = DEFAULT_MARKETPLACE,
): string {
    const fallback = `https://${marketplace}/dp/${asin}/?tag=${encodeURIComponent(partnerTag)}`;
    if (!rawUrl) return fallback;

    try {
        const url = new URL(rawUrl);
        url.searchParams.set("tag", partnerTag);
        return url.toString();
    } catch {
        return fallback;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAmazonItem(item: any, partnerTag: string, source: AmazonProduct["source"], marketplace?: string): AmazonProduct | null {
    const asin = firstString(item?.ASIN, item?.asin);
    if (!asin || asin.length !== 10) return null;

    const title =
        firstString(
            item?.ItemInfo?.Title?.DisplayValue,
            item?.itemInfo?.title?.displayValue,
        ) ?? asin;

    const image = firstString(
        item?.Images?.Primary?.Large?.URL,
        item?.Images?.Primary?.Medium?.URL,
        item?.Images?.Primary?.Small?.URL,
        item?.images?.primary?.large?.url,
        item?.images?.primary?.medium?.url,
        item?.images?.primary?.small?.url,
    );

    const listing = item?.OffersV2?.Listings?.[0] ?? item?.offersV2?.listings?.[0];
    const price = firstString(
        listing?.Price?.DisplayAmount,
        listing?.Price?.SavingBasis?.DisplayAmount,
        listing?.price?.money?.displayAmount,
        listing?.price?.savingBasis?.money?.displayAmount,
        listing?.price?.pricePerUnit?.displayAmount,
    );
    const prime = firstBoolean(
        listing?.DeliveryInfo?.IsPrimeEligible,
        listing?.deliveryInfo?.isPrimeEligible,
    );

    const rating = firstNumber(
        item?.CustomerReviews?.StarRating?.Value,
        item?.customerReviews?.starRating?.value,
    );
    const reviewCount = firstNumber(
        item?.CustomerReviews?.Count,
        item?.customerReviews?.count,
    );

    const url = taggedAmazonUrl(
        firstString(item?.DetailPageURL, item?.detailPageURL),
        asin,
        partnerTag,
        marketplace,
    );

    return {
        asin,
        title,
        price,
        image,
        imageUrl: image,
        rating,
        reviewCount,
        url,
        prime,
        source,
    };
}

interface TokenCache {
    cacheKey: string;
    token: string;
    expiresAt: number;
}

let creatorsTokenCache: TokenCache | null = null;

function creatorsTokenEndpoint(version: string): { url: string; scope: string; includeVersion: boolean; useJsonBody: boolean } {
    if (version.startsWith("3.")) {
        if (version.startsWith("3.2")) {
            return {
                url: "https://api.amazon.co.uk/auth/o2/token",
                scope: "creatorsapi::default",
                includeVersion: false,
                useJsonBody: true,
            };
        }
        if (version.startsWith("3.3")) {
            return {
                url: "https://api.amazon.co.jp/auth/o2/token",
                scope: "creatorsapi::default",
                includeVersion: false,
                useJsonBody: true,
            };
        }
        return {
            url: "https://api.amazon.com/auth/o2/token",
            scope: "creatorsapi::default",
            includeVersion: false,
            useJsonBody: true,
        };
    }

    if (version.startsWith("2.2")) {
        return {
            url: "https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token",
            scope: "creatorsapi/default",
            includeVersion: true,
            useJsonBody: false,
        };
    }
    if (version.startsWith("2.3")) {
        return {
            url: "https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token",
            scope: "creatorsapi/default",
            includeVersion: true,
            useJsonBody: false,
        };
    }
    return {
        url: "https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token",
        scope: "creatorsapi/default",
        includeVersion: true,
        useJsonBody: false,
    };
}

async function getCreatorsAccessToken(creds: CreatorsCreds): Promise<{ token: string; includeVersion: boolean }> {
    const endpoint = creatorsTokenEndpoint(creds.credentialVersion);
    const cacheKey = `${creds.credentialId}|${creds.credentialVersion}|${endpoint.url}`;
    if (
        creatorsTokenCache?.cacheKey === cacheKey &&
        creatorsTokenCache.expiresAt > Date.now() + 60_000
    ) {
        return { token: creatorsTokenCache.token, includeVersion: endpoint.includeVersion };
    }

    const response = endpoint.useJsonBody
        ? await fetch(endpoint.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                grant_type: "client_credentials",
                client_id: creds.credentialId,
                client_secret: creds.credentialSecret,
                scope: endpoint.scope,
            }),
        })
        : await fetch(endpoint.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(`${creds.credentialId}:${creds.credentialSecret}`).toString("base64")}`,
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                scope: endpoint.scope,
            }),
        });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Creators API token request failed (${response.status}): ${body.slice(0, 500)}`);
    }

    const json = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) {
        throw new Error("Creators API token response did not include access_token");
    }

    creatorsTokenCache = {
        cacheKey,
        token: json.access_token,
        expiresAt: Date.now() + Math.max(60, (json.expires_in ?? 3600) - 60) * 1000,
    };

    return { token: json.access_token, includeVersion: endpoint.includeVersion };
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

async function searchCreatorsApi(
    keyword: string,
    options: SearchOptions,
    creds: CreatorsCreds,
): Promise<AmazonProduct[]> {
    const searchIndex = options.searchIndex ?? "All";
    const itemCount = Math.min(Math.max(options.itemCount ?? 10, 1), 10);
    const partnerTag = options.partnerTag ?? creds.partnerTag;
    const queryHash = hashQuery("creators", keyword, searchIndex, itemCount, creds.marketplace, partnerTag);
    const cached = await getCache(queryHash);
    if (cached) return cached;

    const requestBody = {
        keywords: keyword,
        searchIndex,
        itemCount,
        marketplace: creds.marketplace,
        partnerTag,
        resources: CREATORS_RESOURCES,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let json: any;
    const callOnce = async () => {
        await rateLimit();
        const { token, includeVersion } = await getCreatorsAccessToken(creds);
        const response = await fetch(`${CREATORS_API_BASE_URL}/catalog/v1/searchItems`, {
            method: "POST",
            headers: {
                Authorization: includeVersion
                    ? `Bearer ${token}, Version ${creds.credentialVersion}`
                    : `Bearer ${token}`,
                "Content-Type": "application/json",
                "x-marketplace": creds.marketplace,
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const body = await response.text().catch(() => "");
            const retryable = response.status === 429 || response.status >= 500;
            const error = new Error(`Creators API SearchItems failed (${response.status}): ${body.slice(0, 500)}`);
            if (retryable) (error as Error & { status?: number }).status = response.status;
            throw error;
        }
        return response.json();
    };

    try {
        json = await callOnce();
    } catch (err) {
        if (isThrottleError(err)) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            json = await callOnce();
        } else {
            throw err;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = json?.searchResult?.items ?? [];
    const products = items
        .map((item) => normalizeAmazonItem(item, partnerTag, "creators-api", creds.marketplace))
        .filter((product): product is AmazonProduct => product !== null);

    setCache(queryHash, keyword, products).catch(() => {});
    return products;
}

async function searchPaapi(
    keyword: string,
    options: SearchOptions,
    creds: PaapiCreds,
): Promise<AmazonProduct[]> {
    const searchIndex = options.searchIndex ?? "All";
    const itemCount = Math.min(Math.max(options.itemCount ?? 10, 1), 10);
    const partnerTag = options.partnerTag ?? creds.partnerTag;
    const queryHash = hashQuery("paapi", keyword, searchIndex, itemCount, DEFAULT_MARKETPLACE, partnerTag);
    const cached = await getCache(queryHash);
    if (cached) return cached;

    const commonParameters = {
        AccessKey: creds.accessKey,
        SecretKey: creds.secretKey,
        PartnerTag: partnerTag,
        PartnerType: "Associates",
        Marketplace: DEFAULT_MARKETPLACE,
        Host: creds.host,
        Region: creds.region,
    };

    const requestParameters = {
        Keywords: keyword,
        SearchIndex: searchIndex,
        ItemCount: itemCount,
        Resources: PAAPI_RESOURCES,
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
            await new Promise((resolve) => setTimeout(resolve, 2000));
            response = await callOnce();
        } else {
            throw err;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = response?.SearchResult?.Items ?? [];
    const products = items
        .map((item) => normalizeAmazonItem(item, partnerTag, "pa-api", DEFAULT_MARKETPLACE))
        .filter((product): product is AmazonProduct => product !== null);

    setCache(queryHash, keyword, products).catch(() => {});
    return products;
}

/**
 * Search Amazon through the official product-data API.
 *
 * - Uses Creators API when Creators credentials are configured.
 * - Falls back to PA-API 5.0 for legacy deployments.
 * - Caches official Amazon product content for at most 1 hour.
 * - Enforces a local 1 TPS throttle and retries a throttled call once.
 */
export async function searchAmazon(
    keyword: string,
    options: SearchOptions = {},
): Promise<AmazonProduct[]> {
    const trimmed = (keyword ?? "").trim();
    if (!trimmed) return [];

    const config = getProductApiConfig();
    if (config.provider === "creators") {
        return searchCreatorsApi(trimmed, options, config.creds);
    }
    return searchPaapi(trimmed, options, config.creds);
}

export async function lookupTopProduct(
    keyword: string,
    options: SearchOptions = {},
): Promise<AmazonProduct | null> {
    const results = await searchAmazon(keyword, { ...options, itemCount: options.itemCount ?? 3 });
    return results[0] ?? null;
}

/**
 * Enrich AI-recommended products with official Amazon data. A failed lookup for
 * one item degrades that item only; callers still get a usable shortlist with
 * no scraped or fabricated Amazon product content.
 */
export async function enrichProducts<
    T extends { title: string; asin?: string; [key: string]: unknown },
>(
    products: T[],
    options: SearchOptions = {},
): Promise<(T & { amazonData?: AmazonProduct })[]> {
    const enriched: (T & { amazonData?: AmazonProduct })[] = [];
    for (const product of products) {
        try {
            const top = await lookupTopProduct(product.title, options);
            if (top) {
                enriched.push({
                    ...product,
                    asin: top.asin,
                    priceEstimate:
                        top.price ?? (product as Record<string, unknown>).priceEstimate,
                    rating:
                        top.rating ?? (product as Record<string, unknown>).rating,
                    imageUrl: top.image,
                    reviewCount: top.reviewCount,
                    amazonData: top,
                });
            } else {
                enriched.push({ ...product });
            }
        } catch (err) {
            console.warn(
                "[amazon-product-api] enrichment lookup failed:",
                product.title,
                err instanceof Error ? err.message : err,
            );
            enriched.push({ ...product });
        }
    }
    return enriched;
}
