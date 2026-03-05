import * as cheerio from 'cheerio';
import { fetchHtml, extractAmazonUrl, extractImage } from './_base';
import type { DealSource, RawDeal } from './_base';

const BASE = 'https://www.pzdeals.com';

const pzdeals: DealSource = {
    id: 'pzdeals',
    displayName: 'PZDeals',

    async fetch(): Promise<RawDeal[]> {
        const html = await fetchHtml(BASE);
        if (!html) return [];

        const $ = cheerio.load(html);
        const items: { title: string; href: string; img: string }[] = [];

        // Regular product grid
        $('ul.grid.clearfix li').each((_, el) => {
            const title = $(el).find('div.prod-caption a').text().trim();
            const href = $(el).find('a.btn.btn-primary, div.prod-caption a').first().attr('href') ?? '';
            const img = $(el).find('img').first().attr('src') ?? '';
            if (title && href) items.push({ title, href, img });
        });

        // Featured deals fallback
        if (items.length === 0) {
            $('div.col-lg-4.featureddeal-item').each((_, el) => {
                const title = $(el).find('img').first().attr('alt') ?? $(el).find('a').first().attr('title') ?? '';
                const href = $(el).find('a').first().attr('href') ?? '';
                const img = $(el).find('img').first().attr('src') ?? '';
                if (title && href) items.push({ title, href, img });
            });
        }

        // Fetch each product page to find Amazon URL
        const CHUNK = 8;
        const deals: RawDeal[] = [];

        for (let i = 0; i < items.length; i += CHUNK) {
            const chunk = items.slice(i, i + CHUNK);
            const htmls = await Promise.all(
                chunk.map((item) => {
                    const url = item.href.startsWith('http') ? item.href : `${BASE}${item.href}`;
                    return fetchHtml(url);
                })
            );

            chunk.forEach((item, idx) => {
                const pageHtml = htmls[idx];
                if (!extractAmazonUrl(pageHtml)) return; // skip non-Amazon deals

                deals.push({
                    title: item.title,
                    contentHtml: pageHtml,
                    imageUrl: item.img || extractImage(pageHtml),
                    dealPageUrl: item.href.startsWith('http') ? item.href : `${BASE}${item.href}`,
                });
            });
        }

        return deals;
    },
};

export default pzdeals;
