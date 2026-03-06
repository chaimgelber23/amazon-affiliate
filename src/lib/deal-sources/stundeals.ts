import { fetchHtml, extractAsin } from './_base';
import type { DealSource, RawDeal } from './_base';

const BASE = 'https://stundeals.com';

/** Extract every unique Amazon URL (with a valid ASIN) from a block of text */
function extractAllAmazonUrls(text: string): string[] {
    const seen = new Set<string>();
    const re = /https?:\/\/(?:www\.)?amazon\.com\/[^\s"'<>)]*/gi;
    for (const m of text.matchAll(re)) {
        if (extractAsin(m[0])) seen.add(m[0]);
    }
    return [...seen];
}

/** Try to find a product title near a URL in JSON-flavoured text */
function findNearbyTitle(text: string, urlIndex: number): string | undefined {
    const window = text.slice(Math.max(0, urlIndex - 600), urlIndex + 100);
    const m = window.match(/"(?:title|name|productTitle|product_title)"\s*:\s*"([^"]{5,200})"/i);
    return m ? m[1] : undefined;
}

const stundeals: DealSource = {
    id: 'stundeals',
    displayName: 'StunDeals',

    async fetch(): Promise<RawDeal[]> {
        const html = await fetchHtml(BASE);
        if (!html) return [];

        // Prefer __NEXT_DATA__ JSON (richer, more structured)
        const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
        const searchText = nextData ? nextData[1] : html;

        const amazonUrls = extractAllAmazonUrls(searchText);
        if (amazonUrls.length === 0) return [];

        const deals: RawDeal[] = [];
        const seenAsins = new Set<string>();

        for (const url of amazonUrls) {
            const asin = extractAsin(url);
            if (!asin || seenAsins.has(asin)) continue;
            seenAsins.add(asin);

            const idx = searchText.indexOf(url);
            const title = findNearbyTitle(searchText, idx) ?? `Stun Deal (${asin})`;

            deals.push({
                title,
                contentHtml: url, // sync route calls extractAmazonUrl(contentHtml)
                dealPageUrl: BASE,
            });
        }

        return deals;
    },
};

export default stundeals;
