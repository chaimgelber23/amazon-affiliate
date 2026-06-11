import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { RotatingText } from "@/components/RotatingText";
import { TrendingProducts } from "@/components/TrendingProducts";
import { HeroOrganicLoop } from "@/components/HeroOrganicLoop";

// Re-render the home page (and refresh trending PA-API data) every 30 min.
// Stays well under PA-API's 1-hour price-cache ceiling.
export const revalidate = 1800;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://productfindai.com";

// Mix of abstract calls-to-action and concrete category examples. Phrases
// kept ≤14 chars so the longest (italic Fraunces at the H1's 44px mobile
// size) safely fits inside a 320–375px viewport without horizontal overflow.
const ROTATING_QUERIES = [
    "what you want",
    "standing desk",
    "the right gift",
    "coffee grinder",
    "your next pick",
    "running shoe",
    "what to buy",
    "kitchen knife",
];

function HomeJsonLd() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "ProductFindAI",
        url: siteUrl,
        applicationCategory: "ShoppingApplication",
        description:
            "Save hours of Amazon research. ProductFindAI filters the seller word salad and hands you 6-8 picks. Refine inside your results to narrow further.",
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

function BrowserChrome() {
    return (
        <span className="inline-flex items-center gap-2 text-white/35 ml-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </span>
    );
}

export default function HomePage() {
    return (
        <div className="relative">
            <HomeJsonLd />

            {/* ── HERO ──
                Single-column centered, search-bar dominant.
                Organic loop runs full-bleed behind the content.
                Above-the-fold compliance disclosure sits directly above the search bar. */}
            <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-8 py-12 lg:py-16 overflow-hidden">
                {/* The hero's signature visual — fills the full hero, sits behind everything */}
                <div className="absolute inset-0 -z-10">
                    <HeroOrganicLoop className="opacity-90" />
                </div>

                <div className="relative z-10 max-w-4xl w-full text-center animate-fade-in-up">
                    {/* The headline — Fraunces variable serif, organic optical-size */}
                    <h1
                        className="font-display text-[44px] sm:text-6xl lg:text-7xl xl:text-[88px] font-medium text-[var(--color-ink)] tracking-[-0.035em] leading-[0.98] mb-6"
                        style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 144' }}
                    >
                        The shortlist for{" "}
                        <span className="relative inline-block">
                            <RotatingText
                                words={ROTATING_QUERIES}
                                className="italic font-medium text-[var(--color-plum)]"
                            />
                        </span>
                        ,
                        <br />
                        without the noise.
                    </h1>

                    <p className="text-lg sm:text-xl text-[var(--color-ink-muted)] mb-9 max-w-2xl mx-auto leading-snug font-normal">
                        Type what you want. We read past the keyword-stuffed listings and hand you{" "}
                        <span className="font-semibold text-[var(--color-ink)]">six to eight picks, ranked</span>. Then narrow the list inside — &ldquo;under $200&rdquo;, &ldquo;walnut&rdquo;, &ldquo;for a small office&rdquo; — until it&apos;s exactly what you wanted.
                    </p>

                    {/* Above-the-fold affiliate disclosure — sits right above the search bar.
                        Required for Amazon Associates compliance per audit point #1. */}
                    <p className="text-[11px] text-[var(--color-ink-dim)] mb-3 max-w-xl mx-auto leading-relaxed">
                        As an Amazon Associate we earn from qualifying purchases.
                    </p>

                    <SearchBox />

                    {/* Secondary CTA + tertiary disclosure link */}
                    <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-x-5 gap-y-3 text-sm">
                        <Link
                            href="/extension"
                            className="inline-flex items-center gap-2 font-semibold text-[var(--color-ink)] bg-[var(--color-bg-card-solid)] border border-[var(--color-border-strong)] hover:border-[var(--color-plum)] hover:text-[var(--color-plum)] px-5 py-2.5 rounded-full transition-all shadow-[0_2px_6px_-2px_rgba(91,33,182,0.12)]"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="3.5" />
                            </svg>
                            Or get the Chrome extension
                        </Link>
                        <Link
                            href="/privacy#amazon-affiliate-links"
                            className="text-[12px] text-[var(--color-ink-dim)] hover:text-[var(--color-ink-muted)] underline-offset-2 hover:underline transition-colors"
                        >
                            How affiliate links work
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── WHAT IT DOES ──
                Sales-clarity section. Single-column editorial — no double demo panels.
                Three-step explainer, then the differentiator (search-within-search). */}
            <section className="relative py-24 sm:py-28 px-4 sm:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16 sm:mb-20">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-rose)] mb-4">
                            How it works
                        </p>
                        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium text-[var(--color-ink)] tracking-[-0.035em] leading-[1.0] max-w-3xl mx-auto">
                            We do the search.{" "}
                            <span className="text-[var(--color-ink-dim)] italic">You get the shortlist.</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 lg:gap-12">
                        <div className="relative">
                            <span className="font-mono tnum text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-plum)]">
                                Step one
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)] mt-3 leading-tight tracking-tight">
                                Type what you want.
                            </h3>
                            <p className="text-[var(--color-ink-muted)] leading-relaxed mt-4 text-[15px]">
                                Plain English. &ldquo;Standing desk under $300.&rdquo; &ldquo;Best espresso for a beginner.&rdquo; &ldquo;Wireless headphones for travel.&rdquo; Mistype it &mdash; we&apos;ll figure it out.
                            </p>
                        </div>
                        <div className="relative">
                            <span className="font-mono tnum text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-rose)]">
                                Step two
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)] mt-3 leading-tight tracking-tight">
                                Get six to eight picks.
                            </h3>
                            <p className="text-[var(--color-ink-muted)] leading-relaxed mt-4 text-[15px]">
                                Ranked. Across budget, mid-range, and premium. Each with one line on why it earns its slot &mdash; and one line on what you give up by picking it.
                            </p>
                        </div>
                        <div className="relative">
                            <span className="font-mono tnum text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
                                Step three
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)] mt-3 leading-tight tracking-tight">
                                Narrow without restarting.
                            </h3>
                            <p className="text-[var(--color-ink-muted)] leading-relaxed mt-4 text-[15px]">
                                The same search bar refines what you already see. Type &ldquo;under $200&rdquo;, &ldquo;walnut&rdquo;, &ldquo;quieter&rdquo; &mdash; the list collapses around the new constraint instead of starting over.
                            </p>
                        </div>
                    </div>

                    {/* Key differentiator callout */}
                    <div className="mt-20 sm:mt-24 text-center">
                        <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-[var(--color-bg-card-solid)] border border-[var(--color-border-strong)] rounded-full px-5 py-2 shadow-[0_4px_16px_-4px_rgba(91,33,182,0.10)]">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-plum)]">Search-within-search</span>
                            <span className="text-[var(--color-ink-dim)]">·</span>
                            <span className="text-sm font-medium text-[var(--color-ink-muted)]">Refining keeps your shortlist intact. Restart only when you want a new category.</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── EDITORIAL TRENDING — server-rendered, real PA-API or fallback search-link cards ── */}
            <TrendingProducts />

            {/* ── CHROME EXTENSION CTA ── */}
            <section className="relative py-24 sm:py-32 px-4 sm:px-8 overflow-hidden">
                {/* Section bg — deep plum surface with subtle gradient pool */}
                <div className="absolute inset-x-4 sm:inset-x-8 inset-y-0 -z-10 rounded-[40px] bg-[var(--color-ink)] overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-60"
                        style={{
                            background:
                                "radial-gradient(ellipse 60% 50% at 18% 20%, rgba(91, 33, 182, 0.55), transparent 60%), radial-gradient(ellipse 50% 40% at 85% 80%, rgba(225, 29, 72, 0.40), transparent 60%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(217, 119, 6, 0.25), transparent 60%)",
                        }}
                    />
                </div>

                <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center text-white">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300 mb-5 inline-flex items-center gap-2">
                            <span className="w-5 h-px bg-amber-300" aria-hidden="true" />
                            On Amazon itself
                        </p>
                        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium tracking-[-0.035em] leading-[1.0] mb-6">
                            Already searching?{" "}
                            <span className="italic text-white/65">Skip a step.</span>
                        </h2>
                        <p className="text-base sm:text-lg text-white/70 leading-relaxed mb-8 max-w-md">
                            The Chrome extension drops a ProductFindAI button onto every Amazon search results page. Click it, get the pick, never leave the tab.
                        </p>
                        <Link
                            href="/extension"
                            className="btn-amazon text-base px-8 py-4 inline-flex items-center gap-2 shadow-2xl shadow-black/30"
                        >
                            Get the extension
                        </Link>
                    </div>

                    {/* Browser-frame illustration */}
                    <div className="hidden md:block">
                        <div className="bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center px-4 py-2.5 bg-white/[0.02] border-b border-white/10">
                                <span className="font-mono tnum text-[11px] uppercase tracking-[0.18em] text-white/40">
                                    amazon.com/s
                                </span>
                                <BrowserChrome />
                            </div>
                            <div className="px-4 py-3 border-b border-white/10">
                                <div className="bg-white/5 rounded-md px-3 py-1.5 flex items-center gap-2 text-[12px] font-mono text-white/55">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <rect x="3" y="11" width="18" height="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    https://www.amazon.com/s?k=standing+desk
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="bg-white/5 rounded-md px-3 py-2.5 text-[12px] text-white/55 font-mono">
                                    standing desk under $300
                                </div>
                                <div
                                    className="rounded-md px-3 py-2.5 inline-flex items-center gap-2 text-sm font-bold text-white"
                                    style={{ background: "linear-gradient(135deg, #5B21B6 0%, #E11D48 100%)" }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
                                    Search with ProductFindAI
                                </div>
                                <p className="text-[11px] text-white/40 pt-2 leading-relaxed">
                                    The button appears on every Amazon search page.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
