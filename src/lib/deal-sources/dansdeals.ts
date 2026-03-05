import Parser from 'rss-parser';
import { fetchHtml, extractImage } from './_base';
import type { DealSource, RawDeal } from './_base';

const parser = new Parser({ timeout: 10000 });

const dansdeals: DealSource = {
    id: 'dansdeals',
    displayName: 'DansDeals',

    async fetch(): Promise<RawDeal[]> {
        const feed = await parser.parseURL('https://www.dansdeals.com/feed');

        // Only process posts under /amazon/ category
        const amazonItems = (feed.items ?? []).filter(
            (item) => item.link?.includes('/amazon/')
        );

        const CHUNK = 8;
        const deals: RawDeal[] = [];

        for (let i = 0; i < amazonItems.length; i += CHUNK) {
            const chunk = amazonItems.slice(i, i + CHUNK);
            const htmls = await Promise.all(chunk.map((item) => fetchHtml(item.link ?? '')));

            chunk.forEach((item, idx) => {
                const html = htmls[idx];
                deals.push({
                    title: item.title ?? '',
                    contentHtml: html,
                    imageUrl: extractImage(html),
                    dealPageUrl: item.link ?? '',
                    publishedAt: item.pubDate ?? item.isoDate,
                });
            });
        }

        return deals;
    },
};

export default dansdeals;
