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

export default function HomePage() {
    return (
        <div className="relative overflow-hidden">
            <HomeJsonLd />

            <div className="mesh-orb w-[700px] h-[700px] bg-indigo-400/15 top-[-220px] left-1/2 -translate-x-1/2 animate-float" />
            <div className="mesh-orb w-[400px] h-[400px] bg-amber-300/15 top-[200px] right-[-120px] stagger-2 animate-float" />

            {/* ── HERO — full viewport ── */}
            <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-8 py-12 text-center animate-fade-in-up">
                <div className="max-w-4xl mx-auto relative z-10 w-full">

                    <h1 className="font-display text-[44px] sm:text-7xl md:text-[88px] font-extrabold text-slate-900 tracking-[-0.045em] leading-[0.98] mb-6">
                        Save hours of
                        <br />
                        Amazon research.
                    </h1>

                    <p className="text-lg sm:text-2xl text-[var(--color-surface-muted)] mb-10 max-w-2xl mx-auto leading-snug font-medium">
                        We filter the word salad. Find a good{" "}
                        <RotatingText words={ROTATING_QUERIES} className="text-[var(--color-accent)] font-semibold" />
                        .
                    </p>

                    <SearchBox />

                    <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-x-5 gap-y-3 text-sm">
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

            {/* ── CHROME EXTENSION CTA ── */}
            <section className="py-24 sm:py-32 px-4 sm:px-8 relative overflow-hidden bg-[var(--color-surface)] text-white">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-accent)]/20 via-transparent to-amber-400/10" />

                <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">

                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300 mb-5">
                            On Amazon itself
                        </p>
                        <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.04em] leading-[1.0] mb-6">
                            Install on Chrome.
                        </h2>
                        <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-md">
                            The extension drops a PureFind button onto every Amazon search results page. Click it, get the pick — without leaving the tab.
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
