// Server component — renders curated trending picks on the home page.
//
// Why this exists: Amazon Associates reviewers landing on a "search box only"
// site have nothing to evaluate. The Operating Agreement requires that we
// "curate" specific products. This block renders 6 curated picks server-side
// so every visitor (and Amazon's reviewer) sees real affiliate-tagged links
// without any interaction.
//
// Strategy:
//   - Try PA-API for live data (title/price/rating/image).
//   - If PA-API isn't configured yet (pre-approval) or errors, fall back to
//     curated category cards with affiliate-tagged search links. Both paths
//     produce real, clickable, properly-tagged Amazon links.
//
// Caching: 30-min server-side cache via Next ISR (page-level `revalidate`).
// Stays within PA-API's 1-hour price cache rule.

import { searchAmazon, type AmazonProduct } from "@/lib/amazon-paapi";
import { buildAffiliateSearchUrl } from "@/lib/affiliate";

interface TrendingPick {
    category: string;
    query: string;
    blurb: string;
    product: AmazonProduct | null;
}

const TRENDING_QUERIES: { category: string; query: string; blurb: string }[] = [
    {
        category: "Workspace",
        query: "electric standing desk",
        blurb: "Dual-motor sit/stand desks under $400 with strong warranty coverage.",
    },
    {
        category: "Audio",
        query: "wireless noise cancelling headphones",
        blurb: "Active noise-cancelling over-ear headphones for travel and focus work.",
    },
    {
        category: "Kitchen",
        query: "burr coffee grinder",
        blurb: "Conical burr grinders that won't heat or shred your beans.",
    },
    {
        category: "Typing",
        query: "mechanical keyboard wireless",
        blurb: "Hot-swappable wireless mechanical keyboards with quiet switch options.",
    },
    {
        category: "Footwear",
        query: "everyday running shoes neutral",
        blurb: "Neutral-arch running shoes good for daily mileage and gym crossover.",
    },
    {
        category: "Cookware",
        query: "8 inch chef knife",
        blurb: "8-inch chef's knives that hold an edge through real kitchen use.",
    },
];

async function loadTrending(): Promise<TrendingPick[]> {
    const results: TrendingPick[] = [];
    for (const slot of TRENDING_QUERIES) {
        let product: AmazonProduct | null = null;
        try {
            const items = await searchAmazon(slot.query, { itemCount: 1 });
            product = items[0] ?? null;
        } catch {
            // PA-API not configured (pre-approval) or transient error — fall back
            // to the search-link card. We deliberately don't log here to avoid
            // spamming logs during the pre-approval window.
            product = null;
        }
        results.push({ ...slot, product });
    }
    return results;
}

function StarRating({ rating, reviewCount }: { rating?: number; reviewCount?: number }) {
    if (typeof rating !== "number") return null;
    const full = Math.floor(rating);
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="inline-flex gap-px" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < full ? "text-amber-400" : "text-slate-200"}>★</span>
                ))}
            </span>
            <span className="font-mono tnum">{rating.toFixed(1)}</span>
            {typeof reviewCount === "number" && (
                <span className="font-mono tnum text-slate-400">({reviewCount.toLocaleString()})</span>
            )}
        </span>
    );
}

function ProductCard({ pick }: { pick: TrendingPick }) {
    const { product } = pick;
    const href = product?.url ?? buildAffiliateSearchUrl(pick.query);
    const title = product?.title ?? `Top picks: ${pick.query}`;
    const ctaLabel = product ? "View on Amazon" : "Browse top picks";

    return (
        <article className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/[0.04] transition-all flex flex-col">
            <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center overflow-hidden">
                    {product?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={product.image}
                            alt={product.title}
                            width={72}
                            height={72}
                            className="w-full h-full object-contain p-1.5"
                            loading="lazy"
                        />
                    ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                            <path d="M3 9h18M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9l2-5h14l2 5" />
                        </svg>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)] mb-1.5">
                        {pick.category}
                    </p>
                    <h3 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">
                        {title}
                    </h3>
                    {product && (
                        <div className="flex items-center gap-3 mt-2">
                            {product.price && (
                                <span className="font-mono tnum text-sm font-bold text-slate-900">
                                    {product.price}
                                </span>
                            )}
                            <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                        </div>
                    )}
                </div>
            </div>

            <p className="text-[13px] text-slate-600 leading-relaxed mb-5 flex-1">
                {pick.blurb}
            </p>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Affiliate link
                </span>
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-900 hover:text-[var(--color-accent)] transition-colors"
                >
                    {ctaLabel}
                    <span aria-hidden="true">→</span>
                </a>
            </div>
        </article>
    );
}

export async function TrendingProducts() {
    const picks = await loadTrending();

    return (
        <section className="relative py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-slate-50/40 border-y border-slate-200/60">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3">
                            Trending right now
                        </p>
                        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Curated picks across popular categories.
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                        As an Amazon Associate we earn from qualifying purchases.
                        Prices and availability update at Amazon — click to see current.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {picks.map((pick) => (
                        <ProductCard key={pick.query} pick={pick} />
                    ))}
                </div>
            </div>
        </section>
    );
}
