import Parser from 'rss-parser';
import type { DealSource, RawDeal } from './_base';

const parser = new Parser({ timeout: 10000 });

async function fetchPageHtml(url: string): Promise<string> {
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PureFindBot/1.0)' },
            signal: AbortSignal.timeout(8000),
        });
        return res.ok ? await res.text() : '';
    } catch {
        return '';
    }
}

const dansdeals: DealSource = {
    id: 'dansdeals',
    displayName: 'DansDeals',

    async fetch(): Promise<RawDeal[]> {
        const feed = await parser.parseURL('https://www.dansdeals.com/feed');

        // Only process posts categorized under /amazon/ — skip everything else
        const amazonItems = (feed.items ?? []).filter(
            (item) => item.link?.includes('/amazon/')
        );

        // Fetch deal pages in parallel (max 10 at a time)
        const CHUNK = 10;
        const deals: RawDeal[] = [];

        for (let i = 0; i < amazonItems.length; i += CHUNK) {
            const chunk = amazonItems.slice(i, i + CHUNK);
            const htmls = await Promise.all(chunk.map((item) => fetchPageHtml(item.link ?? '')));

            chunk.forEach((item, idx) => {
                deals.push({
                    title: item.title ?? '',
                    contentHtml: htmls[idx],          // full page HTML — contains Amazon URLs
                    dealPageUrl: item.link ?? '',
                    publishedAt: item.pubDate ?? item.isoDate,
                });
            });
        }

        return deals;
    },
};

export default dansdeals;
