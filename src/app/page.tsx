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
            "AI product finder for Amazon. Plain-English search, real prices and ratings, honest pros and cons, no sponsored placements.",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
        featureList: [
            "AI-powered product recommendations",
            "No sponsored results",
            "Real Amazon prices and ratings",
            "Honest pros and cons for every product",
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

function FaqJsonLd() {
    const faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "How does PureFind find the best products?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Google Gemini picks 6-8 candidates that match your spec. The Amazon Product API verifies live prices, ratings, and review counts. You see the same Amazon listing — just without the sponsored noise on top.",
                },
            },
            {
                "@type": "Question",
                name: "Does PureFind cost anything?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Free. PureFind earns a small commission when you buy through our Amazon links — at no extra cost to you. Same price, same Prime shipping, same Amazon checkout.",
                },
            },
            {
                "@type": "Question",
                name: "Are PureFind's recommendations unbiased?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "No seller pays for placement here. There is no deals page, no top-10 listicle, no influencer budget. Recommendations come from Gemini ranking real reviews and specs against your query, full stop.",
                },
            },
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
        />
    );
}

export default function HomePage() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <HomeJsonLd />
            <FaqJsonLd />

            {/* Background mesh orbs */}
            <div className="mesh-orb w-[600px] h-[600px] bg-indigo-500/20 top-[-200px] left-1/2 -translate-x-1/2 animate-float" />
            <div className="mesh-orb w-[400px] h-[400px] bg-amber-400/20 top-[100px] right-[-100px] stagger-2 animate-float" />

            {/* ── HERO ── */}
            <section className="relative pt-20 pb-20 px-4 sm:px-8 text-center animate-fade-in-up">
                <div className="max-w-4xl mx-auto relative z-10">

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent)] mb-10 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                        Unsponsored Amazon search · Beta
                    </div>

                    <h1 className="font-display text-4xl sm:text-5xl md:text-[64px] font-black text-slate-900 tracking-tight leading-[1.05] mb-7">
                        Find a good{" "}
                        <RotatingText
                            words={ROTATING_QUERIES}
                            className="text-[var(--color-accent)]"
                        />
                        .
                        <br />
                        <span className="text-slate-400 font-bold">Skip the listicle spam.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-[var(--color-surface-muted)] mb-9 max-w-2xl mx-auto leading-relaxed">
                        Tell PureFind what you need in plain English. Gemini picks the products. The Amazon Product API verifies the prices. You click through and buy. That&apos;s the whole site.
                    </p>

                    {/* Inline affiliate disclosure (FTC-conspicuous, above the action) */}
                    <p className="text-[12px] text-[var(--color-surface-dim)] mb-6 max-w-xl mx-auto font-medium leading-relaxed">
                        Affiliate disclosure: PureFind earns a small commission on Amazon purchases made through our links. Same price for you.{" "}
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

            {/* ── TRUST STRIP — mechanic-aligned, no fake "as seen in" ── */}
            <section className="py-14 sm:py-20 px-4 sm:px-8 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        <div className="card p-7">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent)] mb-3">
                                The model
                            </p>
                            <h3 className="font-display text-lg font-bold text-[var(--color-surface)] mb-2">
                                Powered by Google Gemini
                            </h3>
                            <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                Gemini reads your spec, ranks 6-8 products against real reviews and specs, writes the &ldquo;why this one&rdquo; rationale.
                            </p>
                        </div>

                        <div className="card p-7">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 mb-3">
                                The data
                            </p>
                            <h3 className="font-display text-lg font-bold text-[var(--color-surface)] mb-2">
                                Real Amazon prices
                            </h3>
                            <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                Every recommendation is verified live against the Amazon Product API. No cached lists. No estimates.
                            </p>
                        </div>

                        <div className="card p-7">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 mb-3">
                                The disclosure
                            </p>
                            <h3 className="font-display text-lg font-bold text-[var(--color-surface)] mb-2">
                                FTC affiliate-disclosed
                            </h3>
                            <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                Amazon pays PureFind a small commission per purchase.{" "}
                                <Link href="/privacy#amazon-affiliate-links" className="text-[var(--color-accent)] hover:underline font-semibold">
                                    Full disclosure
                                </Link>
                                .
                            </p>
                        </div>

                        <div className="card p-7">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-pink-600 mb-3">
                                The anti-pattern
                            </p>
                            <h3 className="font-display text-lg font-bold text-[var(--color-surface)] mb-2">
                                No deals page. No listicles.
                            </h3>
                            <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                One search box, one set of results, one click to Amazon. We don&apos;t farm deals or seed reviews.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-20 sm:py-28 px-4 sm:px-8 relative z-10">
                <div className="mesh-orb w-[500px] h-[500px] bg-pink-500/10 top-[20%] left-[-200px] animate-float stagger-3" />

                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16 animate-fade-in-up stagger-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent)] mb-4">
                            How it works
                        </p>
                        <h2 className="font-display text-3xl sm:text-5xl font-black text-[var(--color-surface)] tracking-tight leading-[1.05] max-w-2xl mx-auto">
                            Three steps. Under ten seconds.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up stagger-2">

                        <div className="card p-8 relative">
                            <p className="font-mono text-sm font-bold text-[var(--color-surface-dim)] mb-5 tnum">
                                01 / Type
                            </p>
                            <h3 className="font-display text-xl font-bold mb-3 text-[var(--color-surface)]">
                                Tell us what you need
                            </h3>
                            <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed mb-5">
                                Plain English. Specs. Constraints. Budget.
                            </p>
                            <p className="font-mono text-xs text-[var(--color-surface-dim)] bg-[var(--color-bg-elevated)] rounded-lg px-3 py-2.5 leading-relaxed">
                                &ldquo;standing desk under $300, deep enough for a 27&Prime; monitor&rdquo;
                            </p>
                        </div>

                        <div className="card p-8 relative">
                            <p className="font-mono text-sm font-bold text-[var(--color-surface-dim)] mb-5 tnum">
                                02 / Pick
                            </p>
                            <h3 className="font-display text-xl font-bold mb-3 text-[var(--color-surface)]">
                                Gemini finds 6–8 candidates
                            </h3>
                            <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                Cross-references reviews, specs, ratings. Writes one-line rationale and short pros / cons for each.
                            </p>
                        </div>

                        <div className="card p-8 relative">
                            <p className="font-mono text-sm font-bold text-[var(--color-surface-dim)] mb-5 tnum">
                                03 / Verify
                            </p>
                            <h3 className="font-display text-xl font-bold mb-3 text-[var(--color-surface)]">
                                We verify on Amazon
                            </h3>
                            <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                Live prices, live ratings, live review counts via the Amazon Product API. Click through to buy on Amazon directly.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="py-20 px-4 sm:px-8 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <h2 className="font-display text-3xl sm:text-4xl font-black text-center text-[var(--color-surface)] mb-12 tracking-tight">
                        Frequently asked questions
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "How does PureFind find the best products?",
                                a: "Google Gemini picks 6-8 candidates that match your spec. The Amazon Product API verifies live prices, ratings, and review counts. You see the same Amazon listing — just without the sponsored noise on top.",
                            },
                            {
                                q: "Does PureFind cost anything?",
                                a: "Free. PureFind earns a small commission when you buy through our Amazon links — at no extra cost to you. Same price, same Prime shipping, same Amazon checkout.",
                            },
                            {
                                q: "Are PureFind's recommendations unbiased?",
                                a: "No seller pays for placement here. There is no deals page, no top-10 listicle, no influencer budget. Recommendations come from Gemini ranking real reviews and specs against your query, full stop.",
                            },
                            {
                                q: "How does the affiliate commission work?",
                                a: "Amazon's Associates program pays a small percentage on qualifying purchases originating from our links — typical category rates run roughly 1-10%. The price you see on Amazon is the price you pay; the commission comes out of Amazon's margin, not yours.",
                            },
                        ].map(({ q, a }) => (
                            <details key={q} className="card p-6 group">
                                <summary className="font-display text-base font-bold text-[var(--color-surface)] cursor-pointer list-none flex items-center justify-between">
                                    {q}
                                    <span className="text-[var(--color-surface-dim)] text-xl transition-transform group-open:rotate-45 ml-4 flex-shrink-0">+</span>
                                </summary>
                                <p className="mt-4 text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                    {a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BOTTOM CTA ── */}
            <section className="py-24 sm:py-32 px-4 sm:px-8 bg-[var(--color-surface)] text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-accent)] to-transparent opacity-15" />
                <div className="max-w-2xl mx-auto relative z-10">
                    <h2 className="font-display text-3xl sm:text-5xl font-black mb-5 tracking-tight leading-[1.05]">
                        One search box.<br />
                        <span className="text-slate-400">No doomscroll.</span>
                    </h2>
                    <p className="text-slate-300 text-lg font-medium mb-10 max-w-md mx-auto">
                        Type what you need. Get what&apos;s actually worth buying.
                    </p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="btn-amazon text-base px-10 py-4 shadow-2xl shadow-orange-500/20"
                    >
                        Search a product
                    </button>
                </div>
            </section>

        </div>
    );
}
