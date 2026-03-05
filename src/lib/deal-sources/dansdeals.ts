import Parser from 'rss-parser';
import type { DealSource, RawDeal } from './_base';

const parser = new Parser({ timeout: 10000 });

const dansdeals: DealSource = {
    id: 'dansdeals',
    displayName: 'DansDeals',

    async fetch(): Promise<RawDeal[]> {
        const feed = await parser.parseURL('https://www.dansdeals.com/feed');
        return (feed.items ?? []).map((item) => ({
            title: item.title ?? '',
            contentHtml: (item['content:encoded'] ?? item.content ?? item.summary ?? ''),
            dealPageUrl: item.link ?? '',
            publishedAt: item.pubDate ?? item.isoDate,
        }));
    },
};

export default dansdeals;
