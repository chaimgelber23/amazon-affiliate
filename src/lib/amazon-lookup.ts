import * as cheerio from "cheerio";

export interface AmazonProduct {
    asin: string;
    title: string;
    price?: string;
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
    url: string;
}

// ── In-memory cache with TTL ──────────────────────────────────────────────────
// Prevents repeated Amazon requests for the same product within 1 hour.
// On Vercel, this persists per serverless instance (warm lambda).

interface CacheEntry {
    data: AmazonProduct | null;
    expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 500;
const cache = new Map<string, CacheEntry>();

function getCached(key: string): AmazonProduct | null | undefined {
    const entry = cache.get(key);
    if (!entry) return undefined; // miss
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return undefined; // expired
    }
    return entry.data; // hit (may be null if product wasn't found)
}

function setCache(key: string, data: AmazonProduct | null) {
    // Evict oldest entries if cache is full
    if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
    }
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Scraper ───────────────────────────────────────────────────────────────────

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
];

function randomUA(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/** Normalize query for cache key */
function cacheKey(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Search Amazon for a product and extract the first result's details.
 * Results are cached for 1 hour. Returns null if blocked or no results found.
 */
export async function lookupProduct(
    query: string,
    tag: string = "purefind-20",
): Promise<AmazonProduct | null> {
    const key = cacheKey(query);

    // Check cache first
    const cached = getCached(key);
    if (cached !== undefined) return cached;

    try {
        const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
        const res = await fetch(searchUrl, {
            headers: {
                "User-Agent": randomUA(),
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Cache-Control": "no-cache",
            },
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            setCache(key, null);
            return null;
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // Find product results — Amazon uses data-asin on result containers
        const results = $('[data-component-type="s-search-result"]');
        if (!results.length) {
            setCache(key, null);
            return null;
        }

        // Try the first few results to find one with a valid ASIN
        for (let i = 0; i < Math.min(results.length, 5); i++) {
            const el = results.eq(i);
            const asin = el.attr("data-asin");

            // Skip sponsored/ad results and invalid ASINs
            if (!asin || asin.length !== 10) continue;
            if (el.find('[data-component-type="sp-sponsored-result"]').length) continue;
            if (el.find(".s-label-popover-default").length) continue;

            const title =
                el.find("h2 a span").first().text().trim() ||
                el.find("h2 span").first().text().trim();

            // Price — try multiple selectors
            const priceWhole = el.find(".a-price .a-price-whole").first().text().replace(",", "").trim();
            const priceFraction = el.find(".a-price .a-price-fraction").first().text().trim();
            let price: string | undefined;
            if (priceWhole) {
                price = `$${priceWhole}${priceFraction ? priceFraction : ""}`;
            } else {
                const offscreen = el.find(".a-price .a-offscreen").first().text().trim();
                if (offscreen) price = offscreen;
            }

            // Image
            const imageUrl =
                el.find("img.s-image").attr("src") ?? undefined;

            // Rating
            const ratingLabel = el.find('[aria-label*="out of 5"]').first().attr("aria-label");
            const rating = ratingLabel
                ? parseFloat(ratingLabel.match(/([\d.]+)\s*out/)?.[1] ?? "")
                : undefined;

            // Review count
            const reviewEl = el.find('[aria-label*="out of 5"]').first().closest("div").find("span.s-underline-text, span[aria-label]").last();
            const reviewText = reviewEl.text().replace(/[^0-9]/g, "");
            const reviewCount = reviewText ? parseInt(reviewText) : undefined;

            if (!title && !asin) continue;

            const product: AmazonProduct = {
                asin,
                title: title || query,
                price,
                imageUrl,
                rating: isNaN(rating ?? NaN) ? undefined : rating,
                reviewCount,
                url: `https://www.amazon.com/dp/${asin}/?tag=${tag}`,
            };

            setCache(key, product);
            return product;
        }

        setCache(key, null);
        return null;
    } catch {
        // Don't cache errors — might be transient
        return null;
    }
}

/**
 * Enrich an array of AI-recommended products with real Amazon data.
 * Processes up to `concurrency` lookups in parallel.
 * Products that can't be found keep their original data with a search URL fallback.
 */
export async function enrichProducts<
    T extends { title: string; asin?: string; [key: string]: unknown },
>(
    products: T[],
    tag: string = "purefind-20",
    concurrency: number = 3,
): Promise<(T & { amazonData?: AmazonProduct })[]> {
    const results: (T & { amazonData?: AmazonProduct })[] = [];

    // Process in batches to respect concurrency limits
    for (let i = 0; i < products.length; i += concurrency) {
        const batch = products.slice(i, i + concurrency);
        const lookups = await Promise.allSettled(
            batch.map((p) => lookupProduct(p.title, tag)),
        );

        for (let j = 0; j < batch.length; j++) {
            const product = batch[j];
            const lookup = lookups[j];
            const amazonData =
                lookup.status === "fulfilled" && lookup.value
                    ? lookup.value
                    : undefined;

            // If we got real data, merge the ASIN and other info
            if (amazonData) {
                results.push({
                    ...product,
                    asin: amazonData.asin,
                    priceEstimate: amazonData.price ?? (product as Record<string, unknown>).priceEstimate,
                    rating: amazonData.rating ?? (product as Record<string, unknown>).rating,
                    imageUrl: amazonData.imageUrl,
                    reviewCount: amazonData.reviewCount,
                    amazonData,
                });
            } else {
                results.push({ ...product });
            }
        }

        // Small delay between batches to be respectful
        if (i + concurrency < products.length) {
            await new Promise((r) => setTimeout(r, 300));
        }
    }

    return results;
}
