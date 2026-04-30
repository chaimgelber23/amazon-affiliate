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
            "Save hours of Amazon research. PureFind filters the seller word salad and hands you 6-8 picks. Refine inside your results to narrow further.",
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

function MiniPickRow({
    rank,
    badge,
    badgeColor,
    title,
    price,
    rating,
    reviews,
}: {
    rank: number;
    badge: string;
    badgeColor: string;
    title: string;
    price: string;
    rating: string;
    reviews: string;
}) {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 9h18M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9l2-5h14l2 5" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono tnum text-[10px] text-slate-400">#{rank}</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${badgeColor}`}>
                        {badge}
                    </span>
                </div>
                <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">
                    {title}
                </p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-mono tnum text-sm font-bold text-slate-900">{price}</span>
                <span className="text-[10px] text-slate-400 font-medium tnum">
                    <span className="text-amber-400" aria-hidden="true">★</span> {rating} · {reviews}
                </span>
            </div>
        </div>
    );
}

function HeroDemoPanel() {
    return (
        <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/10 via-transparent to-amber-400/10 rounded-[32px] blur-2xl" aria-hidden="true" />

            <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl shadow-slate-900/[0.07] p-5 sm:p-6">

                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        8 picks for
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono normal-case tracking-normal text-[11px]">
                            standing desk
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        ranked
                    </span>
                </div>

                <div className="space-y-2">
                    <MiniPickRow
                        rank={1}
                        badge="Top pick"
                        badgeColor="text-[var(--color-accent)]"
                        title="Electric standing desk, 60×30"
                        price="$249"
                        rating="4.6"
                        reviews="12.4k"
                    />
                    <MiniPickRow
                        rank={2}
                        badge="Premium"
                        badgeColor="text-amber-700"
                        title="Walnut height-adjustable, 72×30"
                        price="$549"
                        rating="4.8"
                        reviews="3.2k"
                    />
                    <MiniPickRow
                        rank={3}
                        badge="Budget"
                        badgeColor="text-emerald-700"
                        title="Compact crank-lift desk, 48×24"
                        price="$129"
                        rating="4.4"
                        reviews="8.1k"
                    />
                </div>

                <div className="text-center mt-3">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        + 5 more picks
                    </span>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)] inline-flex items-center gap-1.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="21" y1="21" x2="16.5" y2="16.5" />
                            </svg>
                            Search on your search
                        </p>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                            Refine inside
                        </span>
                    </div>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                        <span className="text-[13px] text-slate-500 flex-1 font-medium">
                            under $200
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                            ↵ refine
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SamplePickCard() {
    return (
        <div className="product-card p-6 sm:p-7 relative overflow-hidden bg-white">
            <div className="absolute -top-10 -right-4 font-display text-[120px] font-extrabold text-slate-100/60 select-none pointer-events-none tnum">
                #1
            </div>

            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 relative z-10">
                <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-[var(--color-border)] flex items-center justify-center">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-slate-400">
                        <path d="M3 9h18M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9l2-5h14l2 5" />
                        <path d="M9 13h6" />
                    </svg>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-[var(--color-accent-muted)] text-[var(--color-accent)] text-[10px] font-black uppercase tracking-[0.18em] rounded-md">
                            Top pick
                        </span>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-[0.15em] rounded-md border border-emerald-200">
                            Verified
                        </span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-surface)] leading-tight tracking-tight">
                        Electric standing desk, 60×30
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                        <span className="font-mono tnum text-2xl font-bold text-[var(--color-surface)] tracking-tight">
                            $249
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-surface-dim)]">
                            <span aria-hidden="true" className="text-amber-400 text-base">★★★★★</span>
                            <span className="font-mono tnum">4.6</span>
                            <span className="text-xs font-mono tnum">(12,440)</span>
                        </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)] mb-2">
                            Why this one
                        </p>
                        <p className="text-[14px] text-[var(--color-surface-muted)] leading-relaxed">
                            Dual motors, 220-lb capacity, 7-year warranty. Cheaper desks in this size use single motors that wear out fast.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5">
                        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--color-surface-dim)]">
                            Example pick
                        </div>
                        <span className="btn-amazon text-sm py-2.5 px-6 cursor-default opacity-95">
                            View on Amazon
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function WindowControls() {
    return (
        <span className="ml-auto inline-flex items-center gap-3 text-white/40">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1" />
            </svg>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <rect x="2.5" y="2.5" width="7" height="7" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1" />
                <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" stroke="currentColor" strokeWidth="1" />
            </svg>
        </span>
    );
}

export default function HomePage() {
    return (
        <div className="relative overflow-hidden">
            <HomeJsonLd />

            <div className="mesh-orb w-[700px] h-[700px] bg-indigo-400/15 top-[-220px] left-1/2 -translate-x-1/2 animate-float" />
            <div className="mesh-orb w-[400px] h-[400px] bg-amber-300/15 top-[200px] right-[-120px] stagger-2 animate-float" />

            {/* ── HERO — two-column with live demo ── */}
            <section className="relative min-h-[calc(100vh-4rem)] flex items-center px-4 sm:px-8 lg:px-12 py-10 lg:py-14 animate-fade-in-up">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">

                    {/* Left: pitch + search */}
                    <div className="text-center lg:text-left">
                        <h1 className="font-display text-[44px] sm:text-6xl lg:text-7xl xl:text-[80px] font-extrabold text-slate-900 tracking-[-0.045em] leading-[0.98] mb-6">
                            Save hours of
                            <br />
                            Amazon research.
                        </h1>

                        <p className="text-lg sm:text-xl text-[var(--color-surface-muted)] mb-9 max-w-xl mx-auto lg:mx-0 leading-snug font-medium">
                            We filter the word salad and hand you{" "}
                            <span className="font-semibold text-slate-900">six to eight picks</span>. Refine inside the list to narrow.{" "}
                            <span className="block sm:inline mt-1 sm:mt-0">
                                Find a good{" "}
                                <RotatingText words={ROTATING_QUERIES} className="text-[var(--color-accent)] font-semibold" />
                                .
                            </span>
                        </p>

                        <SearchBox />

                        <div className="mt-7 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-x-5 gap-y-3 text-sm">
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

                    {/* Right: live-looking demo */}
                    <div className="lg:pl-4">
                        <HeroDemoPanel />
                    </div>

                </div>
            </section>

            {/* ── WHAT IT DOES ── */}
            <section className="py-24 sm:py-32 px-4 sm:px-8 relative z-10 bg-gradient-to-b from-transparent via-slate-50/60 to-transparent">
                <div className="max-w-6xl mx-auto">

                    <div className="text-center mb-14 sm:mb-16">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent)] mb-5">
                            What PureFind does
                        </p>
                        <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold text-[var(--color-surface)] tracking-[-0.04em] leading-[1.0] max-w-3xl mx-auto">
                            We do the search.
                            <br />
                            <span className="text-slate-400">You get the shortlist.</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">

                        <div className="space-y-6 max-w-md">
                            <p className="text-lg text-[var(--color-surface-muted)] leading-relaxed">
                                You type a need. PureFind reads through every Amazon listing in that category — specs, review counts, price spread — and hands you{" "}
                                <span className="font-semibold text-[var(--color-surface)]">six to eight picks, ranked</span>. The top spec for the price. The premium pick. The budget pick. One line on each saying why.
                            </p>
                            <p className="text-lg text-[var(--color-surface-muted)] leading-relaxed">
                                Need narrower? <span className="font-semibold text-[var(--color-surface)]">Search inside your results</span>. &ldquo;Under $200.&rdquo; &ldquo;Walnut.&rdquo; &ldquo;For a small office.&rdquo; Keep refining until the shortlist is exactly what you wanted.
                            </p>

                            <div className="pt-4 flex flex-wrap gap-x-7 gap-y-3">
                                <div>
                                    <p className="font-display font-extrabold text-2xl text-[var(--color-surface)] tnum tracking-tight">6–8</p>
                                    <p className="text-[11px] font-semibold text-[var(--color-surface-dim)] uppercase tracking-wider mt-1">Picks per search</p>
                                </div>
                                <div>
                                    <p className="font-display font-extrabold text-2xl text-[var(--color-surface)] tnum tracking-tight">∞</p>
                                    <p className="text-[11px] font-semibold text-[var(--color-surface-dim)] uppercase tracking-wider mt-1">Refines inside</p>
                                </div>
                                <div>
                                    <p className="font-display font-extrabold text-2xl text-[var(--color-surface)] tnum tracking-tight">$0</p>
                                    <p className="text-[11px] font-semibold text-[var(--color-surface-dim)] uppercase tracking-wider mt-1">No signup</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-surface-dim)] mb-4 text-center md:text-left">
                                The top of the shortlist, expanded
                            </p>
                            <SamplePickCard />
                        </div>

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
                        <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden">

                            <div className="flex items-center px-4 py-2.5 bg-white/[0.03] border-b border-white/10">
                                <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
                                    amazon.com/s
                                </span>
                                <WindowControls />
                            </div>

                            <div className="px-4 py-3 border-b border-white/10">
                                <div className="bg-white/5 rounded-md px-3 py-1.5 flex items-center gap-2 text-[12px] font-mono text-white/50">
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
                                <div className="bg-[var(--color-accent)] text-white rounded-md px-3 py-2.5 inline-flex items-center gap-2 text-sm font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
                                    Search with PureFind
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
