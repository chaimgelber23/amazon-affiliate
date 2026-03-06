// Shared types and utilities for all deal source adapters.
// To add a new site: implement DealSource in a new file, add to index.ts.

export interface RawDeal {
    title: string;
    contentHtml: string;   // full HTML/text content to scan for Amazon URLs
    dealPageUrl: string;   // link back to the source's deal post
    publishedAt?: string;
    imageUrl?: string;
}

export interface DealSource {
    id: string;            // e.g. 'dansdeals'
    displayName: string;   // e.g. 'DansDeals'
    fetch(): Promise<RawDeal[]>;
}

// Dead deal keywords — if any appear in a title, the deal is expired
const DEAD_KEYWORDS = ['[dead]', '[expired]', 'dead -', '- dead', 'expired'];

export function isDead(title: string): boolean {
    const lower = title.toLowerCase();
    return DEAD_KEYWORDS.some((kw) => lower.includes(kw));
}

export function extractAmazonUrl(text: string): string | null {
    const match = text.match(/https?:\/\/(?:www\.)?amazon\.com\/[^\s"'<>)]*/i);
    return match ? match[0] : null;
}

export function extractAsin(url: string): string | null {
    const match = url.match(/\/(?:dp|gp\/product|exec\/obidos\/ASIN)\/([A-Z0-9]{10})/i);
    return match ? match[1].toUpperCase() : null;
}

export function extractPrice(title: string): string | undefined {
    const match = title.match(/\$[\d,]+(?:\.\d{2})?/);
    return match ? match[0] : undefined;
}

export function buildAffiliateUrl(asin: string): string {
    const tag = process.env.NEXT_PUBLIC_AMAZON_TAG ?? 'purefind-20';
    return `https://www.amazon.com/dp/${asin}?tag=${tag}&linkCode=ll1`;
}

/** Extract og:image or first product image from page HTML */
export function extractImage(html: string): string | undefined {
    // og:image is most reliable
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (og) return og[1];
    return undefined;
}

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Fetch a URL with a real Chrome User-Agent, return HTML or empty string on error */
export async function fetchHtml(url: string, timeoutMs = 8000): Promise<string> {
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': CHROME_UA },
            signal: AbortSignal.timeout(timeoutMs),
        });
        return res.ok ? await res.text() : '';
    } catch {
        return '';
    }
}

/** Follow redirect chain and return the final URL. Returns the original URL on error. */
export async function followRedirect(url: string, timeoutMs = 6000): Promise<string> {
    try {
        const res = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            headers: { 'User-Agent': CHROME_UA },
            signal: AbortSignal.timeout(timeoutMs),
        });
        return res.url;
    } catch {
        return url;
    }
}

// ── Generic Shopify deal site adapter ─────────────────────────────────────────
// Most deal aggregator sites run on Shopify. This factory handles all of them:
// 1. Fetch /products.json for the full product list
// 2. Check body_html for Amazon URLs (fast — no extra request)
// 3. If not found, fetch the product page and scan all HTML for amazon.com URLs
//    (this catches JS variables like `var amazonLink = '...'` in the page source)
//
// Adding a new Shopify deal site = one call to createShopifySource() in index.ts

interface ShopifyProduct {
    title: string;
    body_html: string;
    handle: string;
    images: { src: string }[];
}

async function fetchShopifyProducts(baseUrl: string, limit: number): Promise<ShopifyProduct[]> {
    try {
        const res = await fetch(`${baseUrl}/products.json?limit=${limit}`, {
            headers: { 'User-Agent': CHROME_UA },
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];
        const json = await res.json() as { products: ShopifyProduct[] };
        return json.products ?? [];
    } catch {
        return [];
    }
}

export function createShopifySource(config: {
    id: string;
    displayName: string;
    baseUrl: string;
    /** Max products to scan per sync (default 30) */
    limit?: number;
}): DealSource {
    return {
        id: config.id,
        displayName: config.displayName,

        async fetch(): Promise<RawDeal[]> {
            const products = await fetchShopifyProducts(config.baseUrl, config.limit ?? 30);
            const deals: RawDeal[] = [];
            const CHUNK = 6;

            for (let i = 0; i < products.length; i += CHUNK) {
                const chunk = products.slice(i, i + CHUNK);
                const found = await Promise.all(chunk.map(async (product): Promise<RawDeal | null> => {
                    const dealPageUrl = `${config.baseUrl}/products/${product.handle}`;

                    // Strategy 1: Amazon URL in body_html (no extra request)
                    let amazonUrl = extractAmazonUrl(product.body_html ?? '');

                    // Strategy 2: Fetch product page, scan all HTML
                    // Catches JS vars like: var amazonLink = 'https://amazon.com/...'
                    if (!amazonUrl) {
                        const pageHtml = await fetchHtml(dealPageUrl);
                        amazonUrl = extractAmazonUrl(pageHtml);
                    }

                    if (!amazonUrl) return null;

                    return {
                        title: product.title,
                        contentHtml: amazonUrl, // sync route calls extractAmazonUrl(contentHtml)
                        dealPageUrl,
                        imageUrl: product.images?.[0]?.src,
                    };
                }));

                for (const r of found) if (r) deals.push(r);
            }

            return deals;
        },
    };
}
