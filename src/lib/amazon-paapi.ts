// ============================================================================
// ProductFindAI - Amazon official product data client
// ============================================================================
//
// Product data must come from Amazon's official APIs only. No scraping, no
// rendered-page extraction, and no guessed Amazon prices or ratings.
//
// Amazon's current supported path is the Creators API. The deprecated PA-API
// client has intentionally been removed.
//
// Env vars for Creators API:
//   AMAZON_CREATORS_API_CREDENTIAL_ID
//   AMAZON_CREATORS_API_CREDENTIAL_SECRET
//   AMAZON_CREATORS_API_CREDENTIAL_VERSION
//   AMAZON_CREATORS_API_PARTNER_TAG      optional; falls back to PAAPI/public tag
//   AMAZON_CREATORS_API_MARKETPLACE      optional; default "www.amazon.com"
//
// ============================================================================

import crypto from "node:crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
    recordCatalogOutcome,
    shouldRecordCatalogFailure,
    type CatalogOperation,
} from "./catalog-status";
import { reserveSharedApiSlot } from "./rate-limit";

export interface AmazonProduct {
    asin: string;
    parentAsin?: string;
    title: string;
    brand?: string;
    price?: string;
    condition?: string;
    subCondition?: string;
    color?: string;
    size?: string;
    unitCount?: number;
    productGroup?: string;
    image?: string;
    imageUrl?: string;
    features?: string[];
    url: string;
    source?: "creators-api";
    fetchedAt?: string;
}

export interface SearchOptions {
    /** Amazon SearchIndex (e.g. "All", "Electronics", "Books"). Default "All". */
    searchIndex?: string;
    /** Number of items to return (1-10). Default 10. */
    itemCount?: number;
    /** Override partner tag if you want a different one per call. */
    partnerTag?: string;
    /** Parent request cancellation signal. */
    signal?: AbortSignal;
    /** Absolute epoch deadline shared by the whole search request. */
    deadlineAt?: number;
}

interface DeadlineOptions {
    signal?: AbortSignal;
    deadlineAt?: number;
}

const DEFAULT_MARKETPLACE = "www.amazon.com";
const CREATORS_API_BASE_URL = "https://creatorsapi.amazon";

// Amazon's product-content rules cap cached price-bearing API content at 1 hour.
// Since our payload can include price strings, the safe rule is 1 hour for all
// cached official Amazon product content.
const CACHE_TTL_HOURS = 1;
const CREATORS_RESOURCES = [
    "parentASIN",
    "itemInfo.byLineInfo",
    "itemInfo.classifications",
    "itemInfo.title",
    "itemInfo.features",
    "itemInfo.productInfo",
    "images.primary.large",
    "images.primary.medium",
    "images.primary.small",
    "offersV2.listings.condition",
    "offersV2.listings.price",
];

interface CreatorsCreds {
    credentialId: string;
    credentialSecret: string;
    credentialVersion: string;
    partnerTag: string;
    marketplace: string;
}

function normalizeCredentialVersion(value: string | undefined): string | undefined {
    if (!value) return undefined;

    const normalized = value.trim().toLowerCase().replace(/^v/, "");
    if (!/^[23]\.[123]$/.test(normalized)) {
        throw new Error(
            "Amazon Creators API credential version is unsupported; expected v2.1-v2.3 or v3.1-v3.3",
        );
    }
    return normalized;
}

function getPartnerTag(): string | undefined {
    return (
        process.env.AMAZON_CREATORS_API_PARTNER_TAG ??
        process.env.NEXT_PUBLIC_AMAZON_TAG
    )?.trim();
}

function getCreatorsCreds(): CreatorsCreds | null {
    const credentialId = (
        process.env.AMAZON_CREATORS_API_CREDENTIAL_ID ??
        process.env.AMAZON_CREATORS_API_CLIENT_ID
    )?.trim();
    const credentialSecret = (
        process.env.AMAZON_CREATORS_API_CREDENTIAL_SECRET ??
        process.env.AMAZON_CREATORS_API_CLIENT_SECRET
    )?.trim();
    const credentialVersion = normalizeCredentialVersion(
        process.env.AMAZON_CREATORS_API_CREDENTIAL_VERSION ??
        process.env.AMAZON_CREATORS_API_VERSION,
    );
    const partnerTag = getPartnerTag();

    if (!credentialId || !credentialSecret || !credentialVersion || !partnerTag) {
        return null;
    }

    return {
        credentialId,
        credentialSecret,
        credentialVersion,
        partnerTag,
        marketplace:
            process.env.AMAZON_CREATORS_API_MARKETPLACE?.trim() ??
            DEFAULT_MARKETPLACE,
    };
}

export function hasAmazonProductApiConfiguration(): boolean {
    try {
        return getCreatorsCreds() !== null;
    } catch {
        return false;
    }
}

function getProductApiConfig(): CreatorsCreds {
    const creators = getCreatorsCreds();
    if (creators) return creators;

    throw new Error(
        "Amazon Creators API is not configured; see docs/amazon-paapi-setup.md",
    );
}

let lastCallAt = 0;
function remainingTimeMs(
    options: DeadlineOptions,
    maximumMs: number,
): number {
    if (options.signal?.aborted) {
        throw options.signal.reason ??
            new DOMException("Search request was cancelled", "AbortError");
    }
    if (options.deadlineAt === undefined) return maximumMs;
    const remaining = options.deadlineAt - Date.now();
    if (remaining <= 0) {
        throw new DOMException("Search deadline exceeded", "TimeoutError");
    }
    return Math.max(1, Math.min(maximumMs, remaining));
}

function operationSignal(
    options: DeadlineOptions,
    maximumMs: number,
): AbortSignal {
    const timeout = AbortSignal.timeout(
        remainingTimeMs(options, maximumMs),
    );
    return options.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout;
}

async function waitWithDeadline(
    milliseconds: number,
    options: DeadlineOptions,
): Promise<void> {
    if (milliseconds <= 0) return;
    const signal = operationSignal(options, milliseconds + 25);
    await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
        }, milliseconds);
        const onAbort = () => {
            clearTimeout(timer);
            reject(
                signal.reason ??
                    new DOMException(
                        "Search request was cancelled",
                        "AbortError",
                    ),
            );
        };
        signal.addEventListener("abort", onAbort, { once: true });
    });
}

async function raceWithSignal<T>(
    operation: PromiseLike<T>,
    signal: AbortSignal,
): Promise<T> {
    if (signal.aborted) {
        throw signal.reason ??
            new DOMException("Search request was cancelled", "AbortError");
    }
    return new Promise<T>((resolve, reject) => {
        const onAbort = () =>
            reject(
                signal.reason ??
                    new DOMException(
                        "Search request was cancelled",
                        "AbortError",
                    ),
            );
        signal.addEventListener("abort", onAbort, { once: true });
        Promise.resolve(operation).then(
            (value) => {
                signal.removeEventListener("abort", onAbort);
                resolve(value);
            },
            (error) => {
                signal.removeEventListener("abort", onAbort);
                reject(error);
            },
        );
    });
}

async function rateLimit(options: DeadlineOptions) {
    const maximumQueueWait = Math.max(
        0,
        remainingTimeMs(options, 8_000) - 250,
    );
    const leaseSignal = operationSignal(
        options,
        Math.max(250, maximumQueueWait + 250),
    );
    const sharedWait = await raceWithSignal(
        reserveSharedApiSlot(
            "amazon-creators-api",
            1_100,
            maximumQueueWait,
        ),
        leaseSignal,
    );
    if (sharedWait === -1) {
        throw new Error("Amazon product API is busy; shared request queue is full");
    }
    if (typeof sharedWait === "number") {
        if (sharedWait > 0) {
            await waitWithDeadline(sharedWait, options);
        }
        lastCallAt = Date.now();
        return;
    }

    // Local fallback when the shared lease store is temporarily unavailable.
    const now = Date.now();
    const wait = Math.max(0, 1100 - (now - lastCallAt));
    if (wait > 0) await waitWithDeadline(wait, options);
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
        "v3-family-metadata",
        provider,
        keyword.toLowerCase().trim().replace(/\s+/g, " "),
        searchIndex,
        itemCount,
        marketplace,
        partnerTag,
    ].join("|");
    return crypto.createHash("sha256").update(normalized).digest("hex");
}

async function getCache(
    queryHash: string,
    options: DeadlineOptions,
): Promise<AmazonProduct[] | null> {
    const sb = getSupabase();
    if (!sb) return null;
    try {
        if (!(await sweepStaleCache(sb, options))) return null;
        const cutoff = cacheCutoffIso();
        const { data, error } = await raceWithSignal(
            sb
                .from("pf_paapi_cache")
                .select("results, created_at")
                .eq("query_hash", queryHash)
                .gte("created_at", cutoff)
                .maybeSingle(),
            operationSignal(options, 4_000),
        );
        if (error || !data) return null;
        const results = (data.results as AmazonProduct[]) ?? [];
        return results.map((product) => ({
            ...product,
            fetchedAt: product.fetchedAt ?? data.created_at,
        }));
    } catch (error) {
        if (
            options.signal?.aborted ||
            (
                options.deadlineAt !== undefined &&
                options.deadlineAt <= Date.now()
            )
        ) {
            throw error;
        }
        console.warn("[amazon-product-cache] read skipped");
        return null;
    }
}

function cacheCutoffIso(): string {
    return new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

// Delete expired price-bearing Program Content synchronously on every cache
// activity. If cleanup is unavailable, bypass persistence rather than reading
// or writing content whose retention state cannot be verified.
async function sweepStaleCache(
    sb: NonNullable<ReturnType<typeof getSupabase>>,
    options: DeadlineOptions,
): Promise<boolean> {
    const { error } = await raceWithSignal(
        sb
            .from("pf_paapi_cache")
            .delete()
            .lt("created_at", cacheCutoffIso()),
        operationSignal(options, 4_000),
    );
    if (error) {
        console.warn("[amazon-product-cache] stale cleanup unavailable");
        return false;
    }
    return true;
}

async function setCache(
    queryHash: string,
    query: string,
    results: AmazonProduct[],
    options: DeadlineOptions,
): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    if (!(await sweepStaleCache(sb, options))) return;
    await raceWithSignal(
        sb
            .from("pf_paapi_cache")
            .upsert(
                {
                    query_hash: queryHash,
                    query: query.slice(0, 500),
                    results,
                    created_at: new Date().toISOString(),
                },
                { onConflict: "query_hash" },
            ),
        operationSignal(options, 4_000),
    ).then(({ error }) => {
            if (error) console.warn("[amazon-product-cache] write unavailable");
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

function firstStringArray(...values: unknown[]): string[] | undefined {
    for (const value of values) {
        if (!Array.isArray(value)) continue;
        const strings = value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
        if (strings.length > 0) return strings;
    }
    return undefined;
}

function officialAmazonUrl(
    rawUrl: string | undefined,
    asin: string,
    partnerTag: string,
    marketplace = DEFAULT_MARKETPLACE,
): string {
    const fallback = `https://${marketplace}/dp/${asin}/?tag=${encodeURIComponent(partnerTag)}`;
    if (!rawUrl) return fallback;

    try {
        const url = new URL(rawUrl);
        if (
            url.protocol !== "https:" ||
            !(
                url.hostname === marketplace ||
                url.hostname.endsWith(`.${marketplace}`)
            )
        ) {
            return fallback;
        }
        // Creators API detail links may contain attribution and other required
        // parameters. Preserve the official URL byte-for-byte once validated.
        return rawUrl;
    } catch {
        return fallback;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAmazonItem(item: any, partnerTag: string, source: AmazonProduct["source"], marketplace?: string): AmazonProduct | null {
    const asin = firstString(item?.ASIN, item?.asin);
    if (!asin || asin.length !== 10) return null;
    const parentAsin = firstString(item?.ParentASIN, item?.parentASIN);

    const title =
        firstString(
            item?.ItemInfo?.Title?.DisplayValue,
            item?.itemInfo?.title?.displayValue,
        ) ?? asin;
    const brand = firstString(
        item?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
        item?.itemInfo?.byLineInfo?.brand?.displayValue,
    );
    const color = firstString(
        item?.ItemInfo?.ProductInfo?.Color?.DisplayValue,
        item?.itemInfo?.productInfo?.color?.displayValue,
    );
    const size = firstString(
        item?.ItemInfo?.ProductInfo?.Size?.DisplayValue,
        item?.itemInfo?.productInfo?.size?.displayValue,
    );
    const unitCount = firstNumber(
        item?.ItemInfo?.ProductInfo?.UnitCount?.DisplayValue,
        item?.itemInfo?.productInfo?.unitCount?.displayValue,
    );
    const productGroup = firstString(
        item?.ItemInfo?.Classifications?.ProductGroup?.DisplayValue,
        item?.itemInfo?.classifications?.productGroup?.displayValue,
    );

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
        listing?.price?.money?.displayAmount,
    );
    const condition = firstString(
        listing?.Condition?.Value,
        listing?.condition?.value,
    );
    const subCondition = firstString(
        listing?.Condition?.SubCondition?.Value,
        listing?.Condition?.SubCondition,
        listing?.condition?.subCondition?.value,
        listing?.condition?.subCondition,
    );
    const features = firstStringArray(
        item?.ItemInfo?.Features?.DisplayValues,
        item?.itemInfo?.features?.displayValues,
    );

    const url = officialAmazonUrl(
        firstString(item?.DetailPageURL, item?.detailPageURL),
        asin,
        partnerTag,
        marketplace,
    );

    return {
        asin,
        parentAsin,
        title,
        brand,
        price,
        condition,
        subCondition,
        color,
        size,
        unitCount,
        productGroup,
        image,
        imageUrl: image,
        features,
        url,
        source,
        fetchedAt: new Date().toISOString(),
    };
}

interface TokenCache {
    cacheKey: string;
    token: string;
    expiresAt: number;
}

interface CreatorsCatalogResponse {
    searchResult?: { items?: unknown[] };
    itemResults?: { items?: unknown[] };
    itemsResult?: { items?: unknown[] };
}

type CreatorsCatalogOperation = "SearchItems" | "GetItems";

let creatorsTokenCache: TokenCache | null = null;

function creatorsTokenEndpoint(version: string): { url: string; scope: string; includeVersion: boolean; useJsonBody: boolean } {
    switch (version) {
        case "3.1":
            return {
                url: "https://api.amazon.com/auth/o2/token",
                scope: "creatorsapi::default",
                includeVersion: false,
                useJsonBody: true,
            };
        case "3.2":
            return {
                url: "https://api.amazon.co.uk/auth/o2/token",
                scope: "creatorsapi::default",
                includeVersion: false,
                useJsonBody: true,
            };
        case "3.3":
            return {
                url: "https://api.amazon.co.jp/auth/o2/token",
                scope: "creatorsapi::default",
                includeVersion: false,
                useJsonBody: true,
            };
        case "2.1":
            return {
                url: "https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token",
                scope: "creatorsapi/default",
                includeVersion: true,
                useJsonBody: false,
            };
        case "2.2":
            return {
                url: "https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token",
                scope: "creatorsapi/default",
                includeVersion: true,
                useJsonBody: false,
            };
        case "2.3":
            return {
                url: "https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token",
                scope: "creatorsapi/default",
                includeVersion: true,
                useJsonBody: false,
            };
        default:
            throw new Error(
                "Amazon Creators API credential version is unsupported",
            );
    }
}

async function getCreatorsAccessToken(
    creds: CreatorsCreds,
    options: DeadlineOptions,
): Promise<{ token: string; includeVersion: boolean }> {
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
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Agent/ProductFindAI",
            },
            signal: operationSignal(options, 8_000),
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
                "User-Agent": "Agent/ProductFindAI",
            },
            signal: operationSignal(options, 8_000),
            body: new URLSearchParams({
                grant_type: "client_credentials",
                scope: endpoint.scope,
            }),
        });

    if (!response.ok) {
        const error = new Error(
            `Creators API token request failed (${response.status})`,
        );
        (error as Error & { status?: number }).status = response.status;
        throw error;
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

function isExpectedEmptyCatalogResponse(
    operation: CreatorsCatalogOperation,
    status: number,
    payload: unknown,
): boolean {
    if (
        status !== 404 ||
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
    ) {
        return false;
    }

    const error = payload as Record<string, unknown>;
    const exceptionType = firstString(error.type, error.__type);
    if (!exceptionType?.endsWith("ResourceNotFoundException")) {
        return false;
    }

    const resourceType = firstString(error.resourceType)?.toLowerCase();
    return operation === "SearchItems"
        ? resourceType === "searchresult"
        : resourceType === "item";
}

async function callCreatorsCatalogApi(
    operation: CreatorsCatalogOperation,
    requestBody: Record<string, unknown>,
    creds: CreatorsCreds,
    options: DeadlineOptions,
): Promise<unknown> {
    const catalogOperation: CatalogOperation =
        operation === "SearchItems" ? "search-items" : "get-items";
    let catalogRequestStarted = false;
    let observedCatalogFailureStatus: number | undefined;
    const callOnce = async (): Promise<{
        payload: unknown;
        httpStatus: number;
    }> => {
        const { token, includeVersion } = await getCreatorsAccessToken(
            creds,
            options,
        );
        // OAuth work is deliberately outside the shared catalog lease. Reserve
        // the 1-TPS slot only when the request is ready to be sent.
        await rateLimit(options);
        catalogRequestStarted = true;
        const response = await fetch(
            `${CREATORS_API_BASE_URL}/catalog/v1/${
                operation === "SearchItems" ? "searchItems" : "getItems"
            }`,
            {
                method: "POST",
                headers: {
                    Authorization: includeVersion
                        ? `Bearer ${token}, Version ${creds.credentialVersion}`
                        : `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "x-marketplace": creds.marketplace,
                    "User-Agent": "Agent/ProductFindAI",
                },
                signal: operationSignal(options, 10_000),
                body: JSON.stringify(requestBody),
            },
        );
        if (!response.ok) {
            const payload: unknown = await response.json().catch(() => null);
            if (
                isExpectedEmptyCatalogResponse(
                    operation,
                    response.status,
                    payload,
                )
            ) {
                return {
                    payload: {},
                    httpStatus: response.status,
                };
            }
            observedCatalogFailureStatus = response.status;

            const errorPayload =
                payload &&
                typeof payload === "object" &&
                !Array.isArray(payload)
                    ? payload as Record<string, unknown>
                    : {};
            const rawReason = firstString(errorPayload.reason);
            const reason =
                rawReason && /^[A-Za-z][A-Za-z0-9]+$/.test(rawReason)
                    ? rawReason
                    : undefined;
            const error = new Error(
                `Creators API ${operation} failed (${response.status}${
                    reason ? `: ${reason}` : ""
                })`,
            );
            const typedError = error as Error & {
                status?: number;
                retryAfterMs?: number;
                reason?: string;
            };
            typedError.status = response.status;
            typedError.reason = reason;
            if (response.status === 429) {
                const retryAfterHeader = response.headers.get("retry-after");
                const payloadRetryAfter =
                    payload &&
                    typeof payload === "object" &&
                    !Array.isArray(payload)
                        ? (payload as Record<string, unknown>).retryAfterSeconds
                        : undefined;
                const retryAfterSeconds =
                    retryAfterHeader !== null
                        ? Number(retryAfterHeader)
                        : typeof payloadRetryAfter === "number"
                          ? payloadRetryAfter
                          : Number.NaN;
                typedError.retryAfterMs =
                    Number.isFinite(retryAfterSeconds)
                        ? Math.min(
                            5_000,
                            Math.max(1_000, retryAfterSeconds * 1000),
                        )
                        : 2_000;
            }
            throw error;
        }
        return {
            payload: await response.json(),
            httpStatus: response.status,
        };
    };

    try {
        let result;
        try {
            result = await callOnce();
        } catch (error) {
            if (!isThrottleError(error)) throw error;
            const retryAfterMs =
                (error as Error & { retryAfterMs?: number }).retryAfterMs ??
                2_000;
            const jitterMs = Math.floor(Math.random() * 250);
            await waitWithDeadline(retryAfterMs + jitterMs, options);
            result = await callOnce();
        }
        await recordCatalogOutcome({
            outcome: "success",
            operation: catalogOperation,
            httpStatus: result.httpStatus,
        });
        return result.payload;
    } catch (err) {
        const status =
            observedCatalogFailureStatus ??
            (err as { status?: unknown })?.status;
        const requestCancelled =
            options.signal?.aborted === true ||
            (
                options.deadlineAt !== undefined &&
                options.deadlineAt <= Date.now()
            );
        if (
            shouldRecordCatalogFailure({
                error: err,
                catalogRequestStarted,
                catalogFailureObserved:
                    observedCatalogFailureStatus !== undefined,
                requestCancelled,
            })
        ) {
            await recordCatalogOutcome({
                outcome: "failure",
                operation: catalogOperation,
                httpStatus:
                    typeof status === "number"
                        ? status
                        : undefined,
            });
        }
        throw err;
    }
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
    const cached = await getCache(queryHash, options);
    if (cached) return cached;

    const requestBody = {
        keywords: keyword,
        searchIndex,
        itemCount,
        marketplace: creds.marketplace,
        partnerTag,
        resources: CREATORS_RESOURCES,
    };

    const json = await callCreatorsCatalogApi(
        "SearchItems",
        requestBody,
        creds,
        options,
    ) as CreatorsCatalogResponse;

    const items = json.searchResult?.items ?? [];
    const products = items
        .map((item) => normalizeAmazonItem(item, partnerTag, "creators-api", creds.marketplace))
        .filter((product): product is AmazonProduct => product !== null);

    try {
        await setCache(queryHash, keyword, products, options);
    } catch (error) {
        if (options.signal?.aborted) throw error;
        console.warn("[amazon-product-cache] write skipped");
    }
    return products;
}

/**
 * Search Amazon through the official product-data API.
 *
 * - Uses Amazon's supported Creators API.
 * - Caches official Amazon product content for at most 1 hour.
 * - Enforces a shared 1 TPS throttle and retries a throttled call once.
 */
export async function searchAmazon(
    keyword: string,
    options: SearchOptions = {},
): Promise<AmazonProduct[]> {
    const trimmed = (keyword ?? "").trim();
    if (!trimmed) return [];

    const creds = getProductApiConfig();
    return searchCreatorsApi(trimmed, options, creds);
}

/**
 * Retrieve exact Amazon items by ASIN through Creators API GetItems.
 *
 * This intentionally has no SearchItems fallback. Callers must verify that
 * every requested ASIN appears in the returned array before presenting an
 * exact-product result.
 */
export async function getAmazonItems(
    itemIds: string[],
    options: Pick<
        SearchOptions,
        "partnerTag" | "signal" | "deadlineAt"
    > = {},
): Promise<AmazonProduct[]> {
    const normalizedItemIds = Array.from(
        new Set(
            itemIds
                .map((itemId) => itemId.trim().toUpperCase())
                .filter((itemId) => /^[A-Z0-9]{10}$/.test(itemId)),
        ),
    );
    if (
        normalizedItemIds.length === 0 ||
        normalizedItemIds.length > 10 ||
        normalizedItemIds.length !== itemIds.length
    ) {
        return [];
    }

    const creds = getProductApiConfig();
    const partnerTag = options.partnerTag ?? creds.partnerTag;
    const queryHash = hashQuery(
        "creators-get-items",
        [...normalizedItemIds].sort().join(","),
        "ASIN",
        normalizedItemIds.length,
        creds.marketplace,
        partnerTag,
    );
    const cached = await getCache(queryHash, options);
    if (cached) return cached;

    const requestBody = {
        itemIds: normalizedItemIds,
        itemIdType: "ASIN",
        marketplace: creds.marketplace,
        partnerTag,
        resources: CREATORS_RESOURCES,
    };
    const json = await callCreatorsCatalogApi(
        "GetItems",
        requestBody,
        creds,
        options,
    ) as CreatorsCatalogResponse;
    // Amazon's current GetItems response uses itemResults. Accept the
    // documented OffersV2 sample's itemsResult spelling defensively as well.
    const items =
        json.itemResults?.items ?? json.itemsResult?.items ?? [];
    const products = items
        .map((item) =>
            normalizeAmazonItem(
                item,
                partnerTag,
                "creators-api",
                creds.marketplace,
            ),
        )
        .filter((product): product is AmazonProduct => product !== null);

    try {
        await setCache(
            queryHash,
            `get-items:${normalizedItemIds.join(",")}`,
            products,
            options,
        );
    } catch (error) {
        if (options.signal?.aborted) throw error;
        console.warn("[amazon-product-cache] write skipped");
    }
    return products;
}

export async function lookupTopProduct(
    keyword: string,
    options: SearchOptions = {},
): Promise<AmazonProduct | null> {
    const results = await searchAmazon(keyword, { ...options, itemCount: options.itemCount ?? 3 });
    return results[0] ?? null;
}

const MATCH_STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "for",
    "in",
    "of",
    "on",
    "the",
    "to",
    "with",
]);

const GENERIC_PRODUCT_WORDS = new Set([
    "black",
    "bluetooth",
    "compatible",
    "desktop",
    "edition",
    "ergonomic",
    "gaming",
    "gray",
    "grey",
    "keyboard",
    "laptop",
    "mechanical",
    "mini",
    "new",
    "pack",
    "portable",
    "product",
    "version",
    "white",
    "wired",
    "wireless",
]);

const LISTING_VARIANT_WORDS = [
    "adapter",
    "barebones",
    "cable",
    "case",
    "charger",
    "cover",
    "frame",
    "keycaps",
    "mount",
    "openbox",
    "refurbished",
    "renewed",
    "replacement",
    "shell",
    "stand",
    "switches",
    "used",
];

function titleTokens(title: string): string[] {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(
            (token) =>
                (token.length > 1 || /^\d$/.test(token)) &&
                !MATCH_STOP_WORDS.has(token),
        );
}

interface AmazonTitleMatch {
    score: number;
    acceptable: boolean;
}

function amazonTitleMatch(expectedTitle: string, candidateTitle: string): AmazonTitleMatch {
    const expected = titleTokens(expectedTitle);
    const candidate = new Set(titleTokens(candidateTitle));
    if (expected.length === 0 || candidate.size === 0) {
        return { score: 0, acceptable: false };
    }

    const overlap = expected.filter((token) => candidate.has(token));
    const identity = expected.filter(
        (token, index) =>
            index === 0 ||
            /\d/.test(token) ||
            !GENERIC_PRODUCT_WORDS.has(token),
    );
    const identityOverlap = identity.filter((token) => candidate.has(token));
    const modelTokens = identity.slice(1);
    const brandMatches = candidate.has(expected[0]);
    const modelMatches =
        modelTokens.length === 0 ||
        modelTokens.some((token) => candidate.has(token));
    const overlapRatio = overlap.length / expected.length;
    const identityRatio =
        identity.length > 0 ? identityOverlap.length / identity.length : overlapRatio;
    const requiredVariantMissing =
        expected.includes("silent") && !candidate.has("silent");

    let score = overlapRatio + identityRatio * 1.25;
    if (brandMatches) score += 0.35;

    for (const qualifier of LISTING_VARIANT_WORDS) {
        if (candidate.has(qualifier) && !expected.includes(qualifier)) score -= 0.5;
    }

    return {
        score,
        acceptable:
            brandMatches &&
            modelMatches &&
            !requiredVariantMissing &&
            overlapRatio >= 0.3 &&
            identityRatio >= 0.45 &&
            score >= 1.15,
    };
}

function pickBestAmazonMatch(
    expectedTitle: string,
    candidates: AmazonProduct[],
): AmazonProduct | null {
    if (candidates.length === 0) return null;
    const ranked = [...candidates].sort(
        (a, b) =>
            amazonTitleMatch(expectedTitle, b.title).score -
            amazonTitleMatch(expectedTitle, a.title).score,
    );
    const best = ranked[0];
    return best && amazonTitleMatch(expectedTitle, best.title).acceptable ? best : null;
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
            const candidates = await searchAmazon(product.title, {
                ...options,
                itemCount: options.itemCount ?? 3,
            });
            const top = pickBestAmazonMatch(product.title, candidates);
            if (top) {
                enriched.push({
                    ...product,
                    asin: top.asin,
                    priceEstimate:
                        top.price ?? (product as Record<string, unknown>).priceEstimate,
                    imageUrl: top.image,
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
