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
export function buildAffiliateUrl(asin: string): string {
    const tag = process.env.NEXT_PUBLIC_AMAZON_TAG || "purefind-20";
    return `https://www.amazon.com/dp/${asin}?tag=${tag}&linkCode=ogi&th=1&psc=1`;
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
