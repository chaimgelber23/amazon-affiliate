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
            "We do the product research. Type what you want and ProductFindAI returns about 7 ranked picks, each with the catch. Refine in place without starting over.",
        featureList: [
            "Plain-language Amazon product search",
            "Ranked shortlist of about 7 picks per search",
            "One-line reason and one stated trade-off on every pick",
            "Search-within-search refinement that narrows the same list",
            "Links to Amazon to confirm current price, rating, and availability",
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
                            "linear-gradient(rgba(26,15,8,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(26,15,8,0.045) 1px, transparent 1px)",
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
                            ProductFindAI is a free product research tool that turns a plain-English request into a ranked shortlist of about 7 Amazon picks. Every pick carries one line on why it ranks and one line on the catch. Every link goes to Amazon, where you confirm the current price and details before you buy.
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
                                Plain English works. &ldquo;Standing desk under $300.&rdquo; &ldquo;Quiet espresso machine for a beginner.&rdquo; Spelling doesn&rsquo;t matter. We read the request, not the keywords sellers stuffed into their titles.
                            </p>
                        </div>
                        <div className="relative">
                            <span className="font-mono tnum text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-rose)]">
                                Read the picks
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)] mt-3 leading-tight tracking-tight">
                                Get about 7, ranked.
                            </h3>
                            <p className="text-[var(--color-ink-muted)] leading-relaxed mt-4 text-[15px]">
                                Budget, mid-range, premium. Each pick gets one line on why it ranks where it does and one line on what you give up by choosing it. We have no reason to push the expensive one. If two are basically the same, we say so.
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
                                Type &ldquo;under $200&rdquo; or &ldquo;walnut&rdquo; into the same bar and the list filters to what&rsquo;s left. Your short list stays put. You start over only when you want a different category.
                            </p>
                        </div>
                    </div>

                    {/* Key differentiator callout */}
                    <div className="mt-20 sm:mt-24 text-center">
                        <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-[var(--color-bg-card-solid)] border border-[var(--color-border-strong)] rounded-full px-5 py-2 shadow-[0_4px_16px_-4px_rgba(91,33,182,0.10)]">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-plum)]">Search-within-search</span>
                            <span className="text-[var(--color-ink-dim)]">·</span>
                            <span className="text-sm font-medium text-[var(--color-ink-muted)]">Refining narrows the list you already have. No re-scroll, no fresh wall of results.</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── EDITORIAL TRENDING — server-rendered, official Amazon data or fallback search-link cards ── */}
            <TrendingProducts />

        </div>
    );
}
