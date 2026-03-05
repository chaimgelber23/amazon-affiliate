import * as cheerio from 'cheerio';
import type { DealSource, RawDeal } from './_base';

const simplexdeals: DealSource = {
    id: 'simplexdeals',
    displayName: 'SimplexDeals',

    async fetch(): Promise<RawDeal[]> {
        // Use HTTP to bypass expired SSL certificate
        const res = await fetch('http://www.simplexdeals.com', {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PureFindBot/1.0)' },
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];

        const html = await res.text();
        const $ = cheerio.load(html);
        const deals: RawDeal[] = [];

        $('article, .deal-item, .deal-card, [class*="deal"], .post').each((_, el) => {
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

export default simplexdeals;
