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

export interface ExternalDeal {
    asin: string;
    title: string;
    amazon_url: string;       // affiliate URL with tag=purefind-20
    source: string;           // first site that posted it
    sources: string[];        // all sites that posted it
    status: 'live' | 'expired';
    price?: string;
    image_url?: string;
    description?: string;
    original_deal_url?: string;
    posted_at: string;
    last_seen_at: string;
    expired_at?: string;
    created_at: string;
}
