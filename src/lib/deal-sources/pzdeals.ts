import * as cheerio from 'cheerio';
import type { DealSource, RawDeal } from './_base';

const pzdeals: DealSource = {
    id: 'pzdeals',
    displayName: 'PZDeals',

    async fetch(): Promise<RawDeal[]> {
        const res = await fetch('https://www.pzdeals.com', {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PureFindBot/1.0)' },
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];

        const html = await res.text();
        const $ = cheerio.load(html);
        const deals: RawDeal[] = [];

        // PZDeals deal cards — try common selectors
        $('article, .deal-item, .deal-card, [class*="deal"]').each((_, el) => {
            const title = $(el).find('h2, h3, .title, [class*="title"]').first().text().trim();
            const link = $(el).find('a').first().attr('href') ?? '';
            const content = $(el).html() ?? '';

            if (title) {
                deals.push({ title, contentHtml: content, dealPageUrl: link });
            }
        });

        return deals;
    },
};

export default pzdeals;
