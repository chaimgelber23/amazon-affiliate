"use client";

import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { RotatingText } from "@/components/RotatingText";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://purefind.vercel.app";

const ROTATING_QUERIES = [
    "standing desk",
    "coffee grinder",
    "running shoe",
    "mechanical keyboard",
    "kitchen knife",
    "Christmas gift",
];

function HomeJsonLd() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "PureFind",
        url: siteUrl,
        applicationCategory: "ShoppingApplication",
        description:
            "Save hours of Amazon research. PureFind filters the seller word salad and hands you the perfect product.",
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

const NOISE_LISTING =
    "PREMIUM Standing Desk Adjustable Height Electric Sit Stand Desk Memory Preset Modern Office Home 60x30 Inch Black Bamboo Drawer Cable Management 220 lb Capacity Heavy Duty Steel Frame Computer Workstation";

export default function HomePage() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <HomeJsonLd />

            <div className="mesh-orb w-[700px] h-[700px] bg-indigo-400/15 top-[-220px] left-1/2 -translate-x-1/2 animate-float" />
            <div className="mesh-orb w-[400px] h-[400px] bg-amber-300/15 top-[200px] right-[-120px] stagger-2 animate-float" />

            {/* ── HERO ── */}
            <section className="relative pt-10 sm:pt-16 pb-16 px-4 sm:px-8 text-center animate-fade-in-up">
                <div className="max-w-4xl mx-auto relative z-10">

                    <h1 className="font-display text-[44px] sm:text-7xl md:text-[80px] font-extrabold text-slate-900 tracking-[-0.04em] leading-[1.0] mb-6">
                        Save hours of
                        <br />
                        Amazon research.
                    </h1>

                    <p className="text-lg sm:text-2xl text-[var(--color-surface-muted)] mb-9 max-w-2xl mx-auto leading-snug font-medium">
                        We filter the seller word salad and hand you the perfect product. Find a good{" "}
                        <RotatingText words={ROTATING_QUERIES} className="text-[var(--color-accent)] font-semibold" />
                        .
                    </p>

                    <SearchBox />

                    <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                        <Link
                            href="/extension"
                            className="inline-flex items-center gap-2 font-semibold text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded-full transition-all shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="3.5" />
                                <path d="M12 2a10 10 0 0 1 8.66 5L12 12" />
                                <path d="M2.05 13a10 10 0 0 0 5.95 8.5L12 12" />
                                <path d="M21.95 13a10 10 0 0 1-9.95 9L12 12" />
                            </svg>
                            Or get the Chrome extension
                        </Link>
                        <Link
                            href="/privacy#amazon-affiliate-links"
                            className="text-[12px] text-[var(--color-surface-dim)] hover:text-[var(--color-surface-muted)] transition-colors"
                        >
                            Affiliate disclosure
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── DEMO BLOCK ── */}
            <section className="py-24 sm:py-32 px-4 sm:px-8 relative z-10 bg-gradient-to-b from-transparent via-slate-50/60 to-transparent">
                <div className="max-w-3xl mx-auto">

                    <div className="text-center mb-12 sm:mb-14">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-surface-dim)] mb-4">
                            What you&apos;d otherwise scroll
                        </p>
                        <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[var(--color-surface)] tracking-[-0.04em] leading-[1.05]">
                            Eighty words to tell you it&apos;s a desk.
                        </h2>
                    </div>

                    {/* The noise */}
                    <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-5 mb-10 backdrop-blur-sm">
                        <div className="flex gap-4 items-start">
                            <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400 font-mono text-xs tnum">
                                #1
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-slate-500 text-[13px] leading-relaxed line-clamp-3">
                                    {NOISE_LISTING}
                                </p>
                                <div className="mt-2 flex items-center gap-3 text-[11px] font-medium text-slate-400">
                                    <span className="font-mono tnum">$249.99</span>
                                    <span aria-hidden="true">·</span>
                                    <span>★★★★☆ 4.4</span>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-mono tnum">8,243 reviews</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <span className="text-sm font-medium text-[var(--color-surface-dim)] uppercase tracking-[0.18em]">
                            We turn that into
                        </span>
                    </div>

                    {/* The pick */}
                    <div className="product-card p-7 sm:p-8 relative overflow-hidden bg-white">
                        <div className="absolute -top-10 -right-4 font-display text-[120px] font-extrabold text-slate-100/60 select-none pointer-events-none z-0 tnum">
                            #1
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 sm:gap-7 relative z-10">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-[var(--color-border)] flex items-center justify-center">
                                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-slate-400">
                                    <path d="M3 9h18M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9l2-5h14l2 5" />
                                    <path d="M9 13h6" />
                                </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="px-3 py-1 bg-[var(--color-accent-muted)] text-[var(--color-accent)] text-[10px] font-black uppercase tracking-[0.18em] rounded-md">
                                        Top pick
                                    </span>
                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-[0.15em] rounded-md border border-emerald-200">
                                        Verified
                                    </span>
                                </div>

                                <h3 className="font-display text-2xl font-bold text-[var(--color-surface)] leading-tight tracking-tight">
                                    Electric standing desk, 60×30
                                </h3>

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                                    <span className="font-mono tnum text-2xl font-bold text-[var(--color-surface)] tracking-tight">
                                        $249
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-surface-dim)]">
                                        <span aria-hidden="true" className="text-amber-400 text-base">★★★★★</span>
                                        <span className="font-mono tnum">4.6</span>
                                        <span className="text-xs font-mono tnum">(12,440)</span>
                                    </span>
                                </div>

                                <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)] mb-2">
                                        Why this one
                                    </p>
                                    <p className="text-[15px] text-[var(--color-surface-muted)] leading-relaxed">
                                        Dual motors, 220-lb capacity, 7-year warranty. Cheaper desks in this size use single motors that wear out fast.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
                                    <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-[var(--color-surface-dim)]">
                                        Example pick · not a real listing
                                    </div>
                                    <span className="btn-amazon text-sm py-3 px-7 cursor-default opacity-95">
                                        View on Amazon
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CHROME EXTENSION CTA ── */}
            <section className="py-24 sm:py-32 px-4 sm:px-8 relative overflow-hidden bg-[var(--color-surface)] text-white">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-accent)]/20 via-transparent to-amber-400/10" />

                <div className="max-w-4xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">

                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300 mb-5">
                            Or use it on Amazon itself
                        </p>
                        <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.04em] leading-[1.05] mb-6">
                            Install PureFind on Chrome.
                        </h2>
                        <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-md">
                            The extension adds a PureFind button to every Amazon search results page. Click, search, get the pick — without leaving the tab.
                        </p>
                        <Link
                            href="/extension"
                            className="btn-amazon text-base px-8 py-4 inline-flex items-center gap-2 shadow-2xl shadow-orange-500/20"
                        >
                            Get the extension
                        </Link>
                    </div>

                    <div className="hidden md:block">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" aria-hidden="true" />
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" aria-hidden="true" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" aria-hidden="true" />
                                <span className="ml-3 text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
                                    amazon.com/s
                                </span>
                            </div>
                            <div className="bg-white/5 rounded-lg px-4 py-3 mb-3 text-[12px] text-white/60 font-mono">
                                standing desk under $300
                            </div>
                            <div className="bg-[var(--color-accent)] text-white rounded-lg px-4 py-3 inline-flex items-center gap-2 text-sm font-bold">
                                <span className="w-2 h-2 rounded-full bg-white" aria-hidden="true" />
                                Search with PureFind
                            </div>
                            <p className="text-[11px] text-white/40 mt-4 leading-relaxed">
                                One button on every Amazon search page.
                            </p>
                        </div>
                    </div>

                </div>
            </section>

        </div>
    );
}
