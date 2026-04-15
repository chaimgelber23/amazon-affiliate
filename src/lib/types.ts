export interface Product {
    id: string;
    asin: string;
    title: string;
    slug: string;
    category: string;
    description: string;
    pros: string[];
    cons: string[];
    rating: number;
    amazonRating: number;
    amazonReviewCount: number;
    imageUrl: string;
    affiliateUrl: string;
    priceCents: number;
    isFeatured: boolean;
    reviewContent: string;
    badge?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    commissionRate: number;
    productCount: number;
}

export interface AffiliateClick {
    id: string;
    productId: string;
    sourcePage: string;
    clickedAt: string;
}

export interface Comparison {
    id: string;
    title: string;
    slug: string;
    productIds: string[];
    verdict: string;
    createdAt: string;
}

export interface SiteConfig {
    name: string;
    tagline: string;
    description: string;
    url: string;
}

