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
