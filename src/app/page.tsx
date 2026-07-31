import { TrendingProducts } from "@/components/TrendingProducts";
import { HeroShowcase } from "@/components/HeroShowcase";

// Re-render the home page (and refresh official Amazon data) every 30 min.
// Stays well under Amazon's 1-hour price-bearing content cache ceiling.
export const revalidate = 1800;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://productfindai.com";

function HomeJsonLd() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapplication`,
        name: "ProductFindAI",
        url: siteUrl,
        applicationCategory: "ShoppingApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        inLanguage: "en-US",
        isAccessibleForFree: true,
        publisher: { "@id": `${siteUrl}/#organization` },
        description:
            "Describe what you need. ProductFindAI uses official Amazon listing data when catalog access is available and provides an honest Amazon fallback when it is not.",
        featureList: [
            "Plain-language Amazon product search",
            "Official Amazon listing data used only when available",
            "Ranked shortlist based on returned official listing evidence",
            "Unconfirmed requirements disclosed rather than called verified",
            "Refinements recheck only the current shortlist",
            "Tagged Amazon fallback when catalog verification is unavailable",
        ],
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export default function HomePage() {
    return (
        <div className="relative">
            <HomeJsonLd />

            {/* Hero: product-in-action proof, not decorative wallpaper. */}
            <section className="relative isolate overflow-hidden bg-[var(--color-bg)] px-4 sm:px-8 pt-10 sm:pt-14 lg:pt-16 pb-16 lg:min-h-[calc(100vh-4rem)] lg:flex lg:items-center">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(255,253,250,0.82),rgba(250,247,242,0.98)_58%,rgba(245,239,230,0.65))]" />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 opacity-[0.32]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0,34,100,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,34,100,0.045) 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                        maskImage: "linear-gradient(180deg, black 0%, transparent 82%)",
                        WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 82%)",
                    }}
                />

                <div className="relative z-10 max-w-7xl mx-auto w-full">
                    <HeroShowcase />
                </div>
            </section>

            {/* ── WHAT IT DOES ──
                Sales-clarity section. Single-column editorial — no double demo panels.
                Three-step explainer, then the differentiator (search-within-search). */}
            <section id="how-it-works" className="relative py-24 sm:py-28 px-4 sm:px-8 scroll-mt-16">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16 sm:mb-20">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-rose)] mb-4">
                            How it works
                        </p>
                        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium text-[var(--color-ink)] tracking-[-0.035em] leading-[1.0] max-w-3xl mx-auto">
                            You search once.{" "}
                            <span className="text-[var(--color-ink-dim)]">We hand back the short list.</span>
                        </h2>
                        <p className="mt-7 text-base sm:text-lg text-[var(--color-ink-muted)] max-w-2xl mx-auto leading-relaxed">
                            When official catalog access is available, ProductFindAI checks returned Amazon listing fields, removes near-duplicates, and ranks a focused shortlist. It separates supported details from things the listing does not prove. If the catalog is offline, no products are presented as checked—you get a clearly labeled Amazon search link instead.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 lg:gap-12">
                        <div className="relative">
                            <span className="font-mono tnum text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-plum)]">
                                Type it
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)] mt-3 leading-tight tracking-tight">
                                Say what you want.
                            </h3>
                            <p className="text-[var(--color-ink-muted)] leading-relaxed mt-4 text-[15px]">
                                Use plain English. &ldquo;Standing desk under $300.&rdquo; &ldquo;Quiet espresso machine for a beginner.&rdquo; Include concrete details such as budget, size, compatibility, or material.
                            </p>
                        </div>
                        <div className="relative">
                            <span className="font-mono tnum text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-rose)]">
                                Read the picks
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)] mt-3 leading-tight tracking-tight">
                                Get up to 8, ranked.
                            </h3>
                            <p className="text-[var(--color-ink-muted)] leading-relaxed mt-4 text-[15px]">
                                When available, Amazon&apos;s official product service supplies the listing fields ProductFindAI filters and ranks. Explicit conflicts are left out; details the listing does not establish are not called verified. No seller can buy a spot.
                            </p>
                        </div>
                        <div className="relative">
                            <span className="font-mono tnum text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
                                Refine in place
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)] mt-3 leading-tight tracking-tight">
                                Narrow it without restarting.
                            </h3>
                            <p className="text-[var(--color-ink-muted)] leading-relaxed mt-4 text-[15px]">
                                Type &ldquo;under $200&rdquo; or &ldquo;walnut&rdquo; into the same bar. ProductFindAI rechecks only the products already in your shortlist. If that recheck fails, your prior shortlist stays on screen unchanged.
                            </p>
                        </div>
                    </div>

                    {/* Key differentiator callout */}
                    <div className="mt-20 sm:mt-24 text-center">
                        <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-[var(--color-bg-card-solid)] border border-[var(--color-border-strong)] rounded-full px-5 py-2 shadow-[0_4px_16px_-4px_rgba(0,34,100,0.11)]">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-plum)]">Search-within-search</span>
                            <span className="text-[var(--color-ink-dim)]">·</span>
                            <span className="text-sm font-medium text-[var(--color-ink-muted)]">Refining rechecks only the list you already have.</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── EDITORIAL TRENDING — server-rendered, official Amazon data or fallback search-link cards ── */}
            <TrendingProducts />

        </div>
    );
}
