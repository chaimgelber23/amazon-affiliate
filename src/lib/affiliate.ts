import type { SiteConfig } from "./types";

export const siteConfig: SiteConfig = {
    name: process.env.NEXT_PUBLIC_SITE_NAME || "PureFind",
    tagline: "Find the best. Skip the noise.",
    description:
        "PureFind cuts through Amazon's SEO noise to find the products actually worth buying. Search for anything — we'll find the best option.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://purefind.com",
};

/**
 * Build an Amazon affiliate URL for a product ASIN.
 * Uses your Amazon Associates tag from env.
 */
export function buildAffiliateUrl(rawAsin: string): string {
    const tag = process.env.NEXT_PUBLIC_AMAZON_TAG || "purefind-20";
    // If the AI accidentally returns a full URL instead of just the ASIN, extract it
    let asin = rawAsin;
    const match = rawAsin.match(/(?:dp|product|gp\/product|d)\/([A-Z0-9]{10})/i);
    if (match) {
        asin = match[1].toUpperCase();
    } else {
        // Strip any trailing slashes or weird query params if they just passed a dirty ASIN
        asin = rawAsin.split("?")[0].replace(/[^A-Z0-9]/gi, "");
    }

    // Instead of hitting the direct /dp/ route which Amazon frequently blocks 
    // when clicked from external sites or extensions, we use their native search redirector.
    // This looks fully organic to Amazon and guarantees the product page renders.
    return `https://www.amazon.com/s?k=${asin}&tag=${tag}`;
}

/**
 * Build an Amazon search URL with affiliate tag.
 */
export function buildAffiliateSearchUrl(query: string): string {
    const tag = process.env.NEXT_PUBLIC_AMAZON_TAG || "purefind-20";
    return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${tag}`;
}

/** Format price for display */
export function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

/** Monthly revenue estimator for the playbook */
export function estimateMonthlyRevenue(
    monthlyVisitors: number,
    clickThroughRate = 0.08,
    conversionRate = 0.06,
    avgOrderValue = 55,
    commissionRate = 0.04
): number {
    return Math.round(
        monthlyVisitors *
        clickThroughRate *
        conversionRate *
        avgOrderValue *
        commissionRate
    );
}
