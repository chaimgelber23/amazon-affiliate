import type { DealSource, RawDeal } from './_base';

const BASE = 'http://www.simplexdeals.com'; // HTTP — SSL cert expired

interface ShopifyProduct {
    title: string;
    body_html: string;
    handle: string;
    images: { src: string }[];
}

const simplexdeals: DealSource = {
    id: 'simplexdeals',
    displayName: 'SimplexDeals',

    async fetch(): Promise<RawDeal[]> {
        // Shopify's public /products.json API returns body_html which contains the Amazon link.
        // This bypasses JS rendering entirely — the link lives in Shopify's database.
        let products: ShopifyProduct[] = [];
        try {
            const res = await fetch(`${BASE}/products.json?limit=50`, {
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) return [];
            const json = await res.json() as { products: ShopifyProduct[] };
            products = json.products ?? [];
        } catch {
            return [];
        }

        return products
            .filter(p => p.title && p.body_html)
            .map(p => ({
                title: p.title,
                contentHtml: p.body_html, // sync route will call extractAmazonUrl(contentHtml)
                dealPageUrl: `${BASE}/products/${p.handle}`,
                imageUrl: p.images?.[0]?.src,
            }));
    },
};

export default simplexdeals;
