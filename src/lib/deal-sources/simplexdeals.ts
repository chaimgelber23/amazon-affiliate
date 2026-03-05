import * as cheerio from 'cheerio';
import { fetchHtml, extractAmazonUrl, extractImage } from './_base';
import type { DealSource, RawDeal } from './_base';

const BASE = 'http://www.simplexdeals.com'; // HTTP — SSL cert expired

const simplexdeals: DealSource = {
    id: 'simplexdeals',
    displayName: 'SimplexDeals',

    async fetch(): Promise<RawDeal[]> {
        const html = await fetchHtml(BASE);
        if (!html) return [];

        const $ = cheerio.load(html);
        const items: { title: string; href: string; img: string }[] = [];

        // Shopify-style product grid
        $('div.product.grid__item').each((_, el) => {
            const title = $(el).find('div.product__title a').text().trim();
            const href = $(el).find('div.product__title a').attr('href')
                ?? $(el).find('a.product__image-wrapper').attr('href') ?? '';
            const img = $(el).find('img.product__image').attr('data-src')
                ?? $(el).find('img.product__image').attr('src') ?? '';
            if (title && href) items.push({ title, href, img });
        });

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

export default simplexdeals;
