// Server component — renders curated trending picks on the home page.
//
// Why this exists: Amazon Associates reviewers landing on a "search box only"
// site have nothing to evaluate. The Operating Agreement requires that we
// "curate" specific products. This block renders 6 curated picks server-side
// so every visitor (and Amazon's reviewer) sees real affiliate-tagged links
// without any interaction.
//
// Strategy:
//   - Try Amazon's official product API for live data (title/price/image).
//   - If official product API access isn't configured yet or errors, fall back to
//     curated category cards with affiliate-tagged search links. Both paths
//     produce real, clickable, properly-tagged Amazon links.
//
// Caching: 30-min server-side cache via Next ISR (page-level `revalidate`).
// Stays within Amazon's 1-hour price-bearing content cache rule.

import { searchAmazon, type AmazonProduct } from "@/lib/amazon-paapi";
import { buildAffiliateSearchUrl } from "@/lib/affiliate";
import { readCatalogObservation } from "@/lib/catalog-status";
import { isAmazonAccessUnavailableError } from "@/lib/search-core";

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
        blurb: "Height-adjustable desks for home and office setups.",
        take: "Compare the usable height range, weight capacity, controls, warranty, and return terms.",
    },
    {
        category: "Audio",
        query: "wireless noise cancelling headphones",
        blurb: "Over-ear ANC headphones for travel and focused work.",
        take: "Compare ear-cup fit, stated battery life, wired fallback, microphone support, and return terms.",
    },
    {
        category: "Kitchen",
        query: "burr coffee grinder",
        blurb: "Burr grinders across entry-level and mid-range budgets.",
        take: "Compare burr type, grind range, retention and cleanup, hopper size, and replacement-part availability.",
    },
    {
        category: "Typing",
        query: "mechanical keyboard wireless",
        blurb: "Mechanical keyboards with wired and wireless connection options.",
        take: "Confirm the layout, switch type, hot-swap compatibility, connection modes, and included OS keycaps.",
    },
    {
        category: "Footwear",
        query: "everyday running shoes neutral",
        blurb: "Neutral running shoes intended for everyday training.",
        take: "Check the sizing guidance, support category, stated heel-to-toe drop, intended use, and return window.",
    },
    {
        category: "Cookware",
        query: "8 inch chef knife",
        blurb: "General-purpose 8-inch chef's knives.",
        take: "Compare blade steel, handle fit, balance, care instructions, sharpening guidance, and warranty.",
    },
];

const TRENDING_LOAD_DEADLINE_MS = 6_000;
const MAX_TRENDING_SOURCE_AGE_MS = 25 * 60 * 1_000;

function isFreshEnoughForPageCache(product: AmazonProduct): boolean {
    if (!product.fetchedAt) return false;
    const fetchedAt = Date.parse(product.fetchedAt);
    return (
        Number.isFinite(fetchedAt) &&
        Date.now() - fetchedAt <= MAX_TRENDING_SOURCE_AGE_MS
    );
}

async function loadTrending(): Promise<TrendingPick[]> {
    const results: TrendingPick[] = [];
    const deadlineAt = Date.now() + TRENDING_LOAD_DEADLINE_MS;
    const signal = AbortSignal.timeout(TRENDING_LOAD_DEADLINE_MS);
    const catalog = await readCatalogObservation();
    let stopOfficialLookups =
        catalog.status !== "operational" || catalog.stale === true;

    for (const slot of TRENDING_QUERIES) {
        let product: AmazonProduct | null = null;
        if (!stopOfficialLookups && Date.now() < deadlineAt) {
            try {
                const items = await searchAmazon(slot.query, {
                    itemCount: 1,
                    signal,
                    deadlineAt,
                });
                const candidate = items[0] ?? null;
                product =
                    candidate && isFreshEnoughForPageCache(candidate)
                        ? candidate
                        : null;
            } catch (error) {
                product = null;
                if (
                    signal.aborted ||
                    Date.now() >= deadlineAt ||
                    isAmazonAccessUnavailableError(error)
                ) {
                    stopOfficialLookups = true;
                }
            }
        }
        results.push({ ...slot, product });
    }
    return results;
}

function EditorialCard({ pick, featured = false }: { pick: TrendingPick; featured?: boolean }) {
    const { product } = pick;
    const isLiveProduct = !!product;

    // Pre-official-API state: card is a CATEGORY example, not a product pick. Title and CTA reflect that.
    const href = product?.url ?? buildAffiliateSearchUrl(pick.query);
    const title = product?.title ?? `Amazon search · ${pick.query}`;
    const ctaLabel = product ? "Open on Amazon" : "Try this category";

    return (
        <article className={`group relative flex flex-col bg-[var(--color-bg-card-solid)] border border-[var(--color-border)] rounded-3xl overflow-hidden hover:border-[var(--color-border-strong)] hover:shadow-[0_24px_48px_-16px_rgba(0,34,100,0.14)] hover:-translate-y-1 transition-all duration-500 ${featured ? "lg:col-span-2 lg:row-span-2" : ""}`}>
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
                    <span className="w-1 h-1 rounded-full bg-[var(--color-cart-orange)]" aria-hidden="true" />
                    {pick.category}
                </span>
                {/* Pre-launch / non-live "Example" badge — pinned to top-right.
                    Only renders when there's no live official Amazon product data. */}
                {!isLiveProduct && (
                    <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/95 backdrop-blur-sm border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800">
                        Example only
                    </span>
                )}
            </div>

            {/* Editorial body */}
            <div className="flex-1 flex flex-col p-6 sm:p-7">
                <h3 className={`font-display font-medium text-[var(--color-ink)] leading-tight tracking-tight line-clamp-2 ${featured ? "text-2xl sm:text-3xl" : "text-lg"}`}>
                    {title}
                </h3>

                {/* What to look for — generic category guidance, not a product endorsement.
                    Frames the line as "what to evaluate" rather than "we picked this". */}
                <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-rose)] mb-2">
                        What to look for
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
    const liveCount = picks.filter((pick) => pick.product).length;
    const hasLiveProducts = liveCount > 0;

    return (
        <section className="relative py-24 sm:py-32 px-4 sm:px-8 lg:px-12">
            {/* Section gradient pool — pulls in the brand colors softly */}
            <div
                className="absolute inset-x-0 top-0 h-1/2 -z-10 opacity-60 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(254, 114, 29, 0.06), transparent 70%)",
                }}
                aria-hidden="true"
            />

            <div className="max-w-7xl mx-auto">
                {/* Editorial masthead */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 sm:mb-10">
                    <div className="max-w-2xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-rose)] mb-4 inline-flex items-center gap-2">
                            <span className="w-6 h-px bg-[var(--color-rose)]" aria-hidden="true" />
                            {hasLiveProducts ? "Live category examples" : "Categories to try"}
                        </p>
                        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium text-[var(--color-ink)] tracking-[-0.035em] leading-[1.0]">
                            Six categories to try.
                        </h2>
                        <p className="mt-5 text-base sm:text-lg text-[var(--color-ink-muted)] leading-relaxed max-w-xl">
                            {hasLiveProducts
                                ? "Official Amazon data is shown only on the cards where it loaded. Use the search above to check current catalog availability."
                                : "These are category examples, not checked product picks. Each card opens a tagged Amazon search; use the search above to check current catalog availability."}
                        </p>
                    </div>
                    <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed max-w-[22rem]">
                        As an Amazon Associate I earn from qualifying purchases. CERTAIN CONTENT THAT APPEARS ON THIS SITE COMES FROM AMAZON. THIS CONTENT IS PROVIDED &quot;AS IS&quot; AND IS SUBJECT TO CHANGE OR REMOVAL AT ANY TIME.
                    </p>
                </div>

                {/* Report the state actually rendered. Individual cards label
                    official-API fallbacks as "Example only". */}
                <div className={`mb-12 sm:mb-14 p-4 sm:p-5 rounded-2xl flex items-start gap-3 ${
                    hasLiveProducts
                        ? "bg-emerald-50/70 border border-emerald-200"
                        : "bg-amber-50/70 border border-amber-200"
                }`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${hasLiveProducts ? "text-emerald-700" : "text-amber-700"} flex-shrink-0 mt-0.5`}>
                        <circle cx="12" cy="12" r="10" />
                        {hasLiveProducts ? (
                            <polyline points="8 12 11 15 16 9" />
                        ) : (
                            <>
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </>
                        )}
                    </svg>
                    <p className={`text-sm leading-relaxed ${hasLiveProducts ? "text-emerald-900" : "text-amber-900"}`}>
                        {hasLiveProducts ? (
                            <>
                                <strong className="font-semibold">Official Amazon data loaded for {liveCount} of {picks.length} categories.</strong>{" "}
                                Product titles and images come from Amazon&apos;s official product API. Any unavailable card is labeled <strong>Example only</strong>.
                            </>
                        ) : (
                            <>
                                <strong className="font-semibold">Official product data was not loaded for these examples.</strong>{" "}
                                The cards below open Amazon searches and are not presented as checked product picks.
                            </>
                        )}
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
