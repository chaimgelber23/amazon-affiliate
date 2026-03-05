import * as cheerio from 'cheerio';
import { fetchHtml, followRedirect, extractAmazonUrl } from './_base';
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

        const CHUNK = 6;
        const deals: RawDeal[] = [];

        for (let i = 0; i < items.length; i += CHUNK) {
            const chunk = items.slice(i, i + CHUNK);

            // Fetch each product page HTML
            const pageHtmls = await Promise.all(
                chunk.map(item => {
                    const url = item.href.startsWith('http') ? item.href : `${BASE}${item.href}`;
                    return fetchHtml(url);
                })
            );

            // For each product page, find /go/ redirect links and follow them to Amazon
            await Promise.all(chunk.map(async (item, idx) => {
                const pageHtml = pageHtmls[idx];

                // Strategy 1: Find pzdeals.com/go/XXXXX redirect links in the page
                const goPattern = /https?:\/\/(?:www\.)?pzdeals\.com\/go\/[^\s"'<>&]*/gi;
                const goLinks = [...new Set(pageHtml.match(goPattern) ?? [])];

                for (const goUrl of goLinks) {
                    const finalUrl = await followRedirect(goUrl);
                    if (finalUrl.includes('amazon.com')) {
                        deals.push({
                            title: item.title,
                            contentHtml: finalUrl, // put the Amazon URL here so sync route finds it
                            imageUrl: item.img || undefined,
                            dealPageUrl: item.href.startsWith('http') ? item.href : `${BASE}${item.href}`,
                        });
                        return; // found it — stop probing other /go/ links for this deal
                    }
                }

                // Strategy 2: Amazon URL directly in the static HTML (fallback)
                if (extractAmazonUrl(pageHtml)) {
                    deals.push({
                        title: item.title,
                        contentHtml: pageHtml,
                        imageUrl: item.img || undefined,
                        dealPageUrl: item.href.startsWith('http') ? item.href : `${BASE}${item.href}`,
                    });
                }
            }));
        }

        return deals;
    },
};

export default pzdeals;
