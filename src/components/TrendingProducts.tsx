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
    take: string;
    product: AmazonProduct | null;
}

const TRENDING_QUERIES: { category: string; query: string; blurb: string; take: string }[] = [
    {
        category: "Workspace",
        query: "electric standing desk",
        blurb: "Dual-motor sit/stand desks under $400 with strong warranty coverage.",
        take: "Skip the single-motor under-$200 desks — they wobble and the lift wears out inside a year.",
    },
    {
        category: "Audio",
        query: "wireless noise cancelling headphones",
        blurb: "Over-ear ANC headphones for travel and focus work.",
        take: "The flagship Sony and Bose models are 90% as good for half the price. Don't overpay for the latest revision.",
    },
    {
        category: "Kitchen",
        query: "burr coffee grinder",
        blurb: "Conical burr grinders that won't heat or shred your beans.",
        take: "Blade grinders are why your coffee tastes burnt. A mid-range conical burr grinder is the single biggest upgrade.",
    },
    {
        category: "Typing",
        query: "mechanical keyboard wireless",
        blurb: "Hot-swappable wireless boards with quiet switch options.",
        take: "Hot-swap means you can replace switches without soldering. It's the feature that ages best.",
    },
    {
        category: "Footwear",
        query: "everyday running shoes neutral",
        blurb: "Neutral-arch running shoes good for daily mileage and gym crossover.",
        take: "Pick by foot shape, not brand loyalty. Every brand makes a great daily trainer now.",
    },
    {
        category: "Cookware",
        query: "8 inch chef knife",
        blurb: "8-inch chef's knives that hold an edge through real kitchen use.",
        take: "A modest knife sharpened weekly beats an expensive one sharpened never. Buy a honing steel while you're at it.",
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
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-dim)]">
            <span className="inline-flex gap-px" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < full ? "text-amber-500" : "text-[var(--color-bg-elevated)]"}>★</span>
                ))}
            </span>
            <span className="font-mono tnum text-[var(--color-ink-muted)]">{rating.toFixed(1)}</span>
            {typeof reviewCount === "number" && (
                <span className="font-mono tnum text-[var(--color-ink-dim)]">({reviewCount.toLocaleString()})</span>
            )}
        </span>
    );
}

function EditorialCard({ pick, featured = false }: { pick: TrendingPick; featured?: boolean }) {
    const { product } = pick;
    const href = product?.url ?? buildAffiliateSearchUrl(pick.query);
    const title = product?.title ?? `Top picks for ${pick.query}`;
    const ctaLabel = product ? "Open on Amazon" : "Browse the shortlist";

    return (
        <article className={`group relative flex flex-col bg-[var(--color-bg-card-solid)] border border-[var(--color-border)] rounded-3xl overflow-hidden hover:border-[var(--color-border-strong)] hover:shadow-[0_24px_48px_-16px_rgba(91,33,182,0.12)] hover:-translate-y-1 transition-all duration-500 ${featured ? "lg:col-span-2 lg:row-span-2" : ""}`}>
            {/* Image surface — bigger on featured, edge-to-edge top */}
            <div className={`relative bg-[var(--color-bg-warm)] overflow-hidden ${featured ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
                {product?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={product.image}
                        alt={product.title}
                        className="absolute inset-0 w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--color-ink-dim)] opacity-40">
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <path d="M3 16l5-5 4 4 3-3 6 6" />
                            <circle cx="9" cy="9" r="1.5" />
                        </svg>
                    </div>
                )}
                {/* Category tag — pinned to top-left */}
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-card-solid)]/95 backdrop-blur-sm border border-[var(--color-border)] rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-plum)]">
                    <span className="w-1 h-1 rounded-full bg-[var(--color-rose)]" aria-hidden="true" />
                    {pick.category}
                </span>
            </div>

            {/* Editorial body */}
            <div className="flex-1 flex flex-col p-6 sm:p-7">
                <h3 className={`font-display font-medium text-[var(--color-ink)] leading-tight tracking-tight line-clamp-2 ${featured ? "text-2xl sm:text-3xl" : "text-lg"}`}>
                    {title}
                </h3>

                {product && (
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {product.price && (
                            <span className="font-mono tnum text-base font-semibold text-[var(--color-ink)]">
                                {product.price}
                            </span>
                        )}
                        <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                    </div>
                )}

                {/* Editor's take — Wirecutter-style hand-written line */}
                <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-rose)] mb-2">
                        Editor's take
                    </p>
                    <p className={`text-[var(--color-ink-muted)] leading-relaxed ${featured ? "text-base" : "text-sm"}`}>
                        {pick.take}
                    </p>
                </div>

                <p className={`text-[var(--color-ink-dim)] leading-relaxed mt-3 ${featured ? "text-sm" : "text-xs"}`}>
                    {pick.blurb}
                </p>

                <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-[var(--color-border)]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-ink-dim)]">
                        Affiliate link
                    </span>
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer nofollow sponsored"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-plum)] transition-colors"
                    >
                        {ctaLabel}
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                    </a>
                </div>
            </div>
        </article>
    );
}

export async function TrendingProducts() {
    const picks = await loadTrending();
    const [featured, ...rest] = picks;

    return (
        <section className="relative py-24 sm:py-32 px-4 sm:px-8 lg:px-12">
            {/* Section gradient pool — pulls in the brand colors softly */}
            <div
                className="absolute inset-x-0 top-0 h-1/2 -z-10 opacity-60 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(225, 29, 72, 0.06), transparent 70%)",
                }}
                aria-hidden="true"
            />

            <div className="max-w-7xl mx-auto">
                {/* Editorial masthead */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14 sm:mb-16">
                    <div className="max-w-2xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-rose)] mb-4 inline-flex items-center gap-2">
                            <span className="w-6 h-px bg-[var(--color-rose)]" aria-hidden="true" />
                            Editor's desk
                        </p>
                        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium text-[var(--color-ink)] tracking-[-0.035em] leading-[1.0]">
                            What we'd buy this week.
                        </h2>
                        <p className="mt-5 text-base sm:text-lg text-[var(--color-ink-muted)] leading-relaxed max-w-xl">
                            Six categories worth a closer look right now — with a one-line take on what to actually pick. Run any of them through the search bar above to drill in further.
                        </p>
                    </div>
                    <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed max-w-[18rem]">
                        As an Amazon Associate we earn from qualifying purchases. Prices and availability update at Amazon — click to see current.
                    </p>
                </div>

                {/* Magazine-grid: 1 featured + 5 secondary in a 3-col flow */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 lg:auto-rows-fr">
                    {featured && <EditorialCard pick={featured} featured />}
                    {rest.map((pick) => (
                        <EditorialCard key={pick.query} pick={pick} />
                    ))}
                </div>
            </div>
        </section>
    );
}
