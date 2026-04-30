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
            "Cut through the keyword-stuffed Amazon listings. Tell PureFind what you want, get the one to buy. Under 10 seconds.",
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

const NOISE_LISTINGS = [
    "PREMIUM Standing Desk Adjustable Height Electric Sit Stand Desk Memory Preset Modern Office Home 60x30 Inch Black Bamboo Drawer Cable Management 220 lb Capacity Heavy Duty Steel Frame Computer Workstation",
    "Best Electric Standing Desk Height Adjustable Sit Stand Up Computer Workstation Home Office Desk 48x24 Memory Smart Touch Splice Board Stable Heavy Duty Frame Black for Adults Kids",
    "Heavy Duty Adjustable Standing Desk 55-Inch Width Electric Stand Up Computer Desk Sit-to-Stand Workstation Sturdy Steel Frame Memory Preset Cable Management Black Walnut Industrial",
];

function NoiseListingCard({ text, idx }: { text: string; idx: number }) {
    return (
        <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-5 flex gap-4 items-start backdrop-blur-sm">
            <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400 font-mono text-xs tnum">
                #{idx + 1}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-[13px] leading-relaxed line-clamp-3">
                    {text}
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
    );
}

function PureFindDemoCard() {
    return (
        <div className="product-card p-7 sm:p-8 relative overflow-hidden bg-white">
            <div className="absolute -top-10 -right-4 font-display text-[120px] text-slate-100/60 select-none pointer-events-none z-0 tnum italic">
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

                    <h3 className="font-display text-2xl sm:text-3xl text-[var(--color-surface)] leading-tight tracking-tight">
                        Electric standing desk, 60×30
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                        <span className="font-mono tnum text-2xl sm:text-[28px] font-bold text-[var(--color-surface)] tracking-tight">
                            $249
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-surface-dim)]">
                            <span aria-hidden="true" className="text-amber-400 text-base">★★★★★</span>
                            <span className="font-mono tnum">4.6</span>
                            <span className="text-xs font-mono tnum">(12,440)</span>
                        </span>
                    </div>

                    <div className="mt-6 pt-5 border-t border-[var(--color-border)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)] mb-2">
                            Why this one
                        </p>
                        <p className="text-[15px] text-[var(--color-surface-muted)] leading-relaxed">
                            Dual motors, 220-lb capacity, 7-year warranty. The cheaper desks in this size use single motors that wear out fast.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-7">
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
    );
}

export default function HomePage() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <HomeJsonLd />

            <div className="mesh-orb w-[700px] h-[700px] bg-indigo-400/15 top-[-220px] left-1/2 -translate-x-1/2 animate-float" />
            <div className="mesh-orb w-[400px] h-[400px] bg-amber-300/15 top-[200px] right-[-120px] stagger-2 animate-float" />

            {/* ── HERO ── */}
            <section className="relative pt-12 sm:pt-20 pb-20 px-4 sm:px-8 text-center animate-fade-in-up">
                <div className="max-w-4xl mx-auto relative z-10">

                    <h1 className="font-display text-[44px] sm:text-7xl md:text-[88px] text-slate-900 tracking-tight leading-[1.0] mb-7">
                        Find a good{" "}
                        <RotatingText
                            words={ROTATING_QUERIES}
                            className="font-display-italic text-[var(--color-accent)]"
                        />
                        .<br />
                        <span className="text-slate-400 italic font-display">Without the 80-word title.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-[var(--color-surface-muted)] mb-9 max-w-2xl mx-auto leading-relaxed">
                        Amazon listings cram every keyword into the title to rank. PureFind reads through the word salad and hands you the one to buy. Average time start to checkout: under 10 seconds.
                    </p>

                    <p className="text-[12px] text-[var(--color-surface-dim)] mb-7 max-w-xl mx-auto font-medium leading-relaxed">
                        Affiliate disclosure: PureFind earns a small commission on Amazon purchases through our links. Same price for you.{" "}
                        <Link
                            href="/privacy#amazon-affiliate-links"
                            className="text-[var(--color-accent)] hover:underline font-semibold"
                        >
                            How it works
                        </Link>
                    </p>

                    <SearchBox />
                </div>
            </section>

            {/* ── DEMO BLOCK — show the contrast directly ── */}
            <section className="py-24 sm:py-32 px-4 sm:px-8 relative z-10 bg-gradient-to-b from-transparent via-slate-50/60 to-transparent">
                <div className="max-w-4xl mx-auto">

                    <div className="text-center mb-12 sm:mb-16">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-surface-dim)] mb-5">
                            What you&apos;d otherwise scroll through
                        </p>
                        <h2 className="font-display text-3xl sm:text-5xl md:text-6xl text-[var(--color-surface)] tracking-tight leading-[1.05] max-w-3xl mx-auto">
                            Eighty words to tell you it&apos;s a desk.
                        </h2>
                    </div>

                    <div className="space-y-3 max-w-2xl mx-auto mb-14">
                        {NOISE_LISTINGS.map((text, i) => (
                            <NoiseListingCard key={i} text={text} idx={i} />
                        ))}
                    </div>

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-3 text-[var(--color-surface-dim)]">
                            <span className="h-px w-12 bg-[var(--color-border-strong)]" aria-hidden="true" />
                            <span className="font-display-italic text-2xl sm:text-3xl text-[var(--color-accent)]">
                                or, in one card
                            </span>
                            <span className="h-px w-12 bg-[var(--color-border-strong)]" aria-hidden="true" />
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <PureFindDemoCard />
                    </div>

                </div>
            </section>

            {/* ── SALES CLOSE ── */}
            <section className="py-28 sm:py-36 px-4 sm:px-8 relative overflow-hidden bg-[var(--color-surface)] text-white">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-accent)]/20 via-transparent to-amber-400/10" />
                <div className="max-w-3xl mx-auto text-center relative z-10">

                    <h2 className="font-display text-4xl sm:text-6xl md:text-7xl tracking-tight leading-[1.0] mb-8">
                        You don&apos;t have thirty&nbsp;minutes.
                        <br />
                        <span className="font-display-italic text-amber-300">PureFind has ten&nbsp;seconds.</span>
                    </h2>

                    <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-xl mx-auto mb-10">
                        Type what you want. We read the listings, the spec sheets, the reviews. You get one card with the answer, the price, and a one-line reason. Then you click through to Amazon.
                    </p>

                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="btn-amazon text-base px-10 py-4 shadow-2xl shadow-orange-500/20"
                    >
                        Find a product
                    </button>

                </div>
            </section>

        </div>
    );
}
