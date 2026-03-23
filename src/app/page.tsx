"use client";

import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://purefind.com";

function HomeJsonLd() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "PureFind",
        url: siteUrl,
        applicationCategory: "ShoppingApplication",
        description:
            "AI-powered product finder that cuts through Amazon's sponsored results to recommend genuinely great products with real prices and ratings.",
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
            "Live Amazon deal tracking",
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
                    text: "PureFind uses AI to analyze thousands of Amazon products based on real reviews, ratings, and specifications — not sponsored placements. We verify every recommendation with live Amazon data including real prices and review counts.",
                },
            },
            {
                "@type": "Question",
                name: "Does PureFind cost anything?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "PureFind is completely free to use. We earn a small affiliate commission (1-4.5%) when you purchase through our links, at no extra cost to you. You get the same Amazon price and Prime shipping.",
                },
            },
            {
                "@type": "Question",
                name: "Are PureFind's recommendations unbiased?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. No seller pays for placement on PureFind. Our AI recommends products based on genuine quality, reviews, and value — not advertising spend. We also show honest pros and cons for every product.",
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

            {/* Global Mesh Orb Behind Hero */}
            <div className="mesh-orb w-[600px] h-[600px] bg-indigo-500/20 top-[-200px] left-1/2 -translate-x-1/2 animate-float" />
            <div className="mesh-orb w-[400px] h-[400px] bg-amber-400/20 top-[100px] right-[-100px] stagger-2 animate-float" />

            {/* ── HERO ── */}
            <section className="relative pt-28 pb-24 px-4 sm:px-8 text-center animate-fade-in-up">
                <div className="max-w-4xl mx-auto relative z-10">

                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-accent)] mb-10 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                        AI-Powered Shopping Intelligence
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight mb-6">
                        Find the perfect product.<br />
                        <span className="text-slate-400">Skip the sponsored junk.</span>
                    </h1>

                    <p className="text-xl text-[var(--color-surface-muted)] mb-12 max-w-xl mx-auto leading-relaxed font-medium">
                        Tell us what you need. Our AI searches Amazon, verifies real prices and ratings, and shows you what&apos;s genuinely worth buying.
                    </p>

                    <SearchBox />
                </div>
            </section>

            {/* ── TRUST BAR ── */}
            <section className="py-8 bg-white/40 backdrop-blur-md border-y border-[var(--color-border)] relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-8">
                    <div className="flex flex-wrap justify-center gap-y-4 gap-x-8 lg:gap-x-16 text-sm text-[var(--color-surface-muted)] font-bold tracking-wide uppercase">
                        {[
                            "0 Sponsored Results",
                            "Real Amazon Prices",
                            "Verified Ratings",
                            "Instant AI Decisions",
                        ].map((text) => (
                            <span key={text} className="flex items-center gap-2">
                                <span className="text-[var(--color-success)] text-lg">✓</span> {text}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BENTO GRID: WHY PUREFIND & HOW IT WORKS ── */}
            <section className="py-32 px-4 sm:px-8 relative z-10">
                <div className="mesh-orb w-[500px] h-[500px] bg-pink-500/10 top-[20%] left-[-200px] animate-float stagger-3" />

                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20 animate-fade-in-up stagger-1">
                        <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-muted)] mb-6">
                            Smarter shopping in seconds.
                        </h2>
                        <p className="text-lg text-[var(--color-surface-dim)] max-w-2xl mx-auto">
                            We reverse-engineered how you shop to save you hours of reading fake reviews.
                        </p>
                    </div>

                    {/* The Bento Grid Container */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min animate-fade-in-up stagger-2">

                        {/* Big Card 1 */}
                        <div className="card md:col-span-2 p-10 flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full transition-transform duration-700 group-hover:scale-110" />
                            <span className="text-5xl mb-5">🎯</span>
                            <h3 className="text-2xl font-bold mb-4">You ask. We find the real deal.</h3>
                            <p className="text-[var(--color-surface-muted)] leading-relaxed max-w-md text-lg">
                                Just type &quot;I need an ergonomic chair for back pain under $300.&quot; Our AI searches Amazon, verifies prices and reviews, then shows you what&apos;s actually worth buying.
                            </p>
                        </div>

                        {/* Tall Card */}
                        <div className="card md:row-span-2 p-10 flex flex-col items-center text-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-500/5 rotate-180 transition-opacity duration-700 group-hover:opacity-100 opacity-50" />
                            <div className="w-20 h-20 bg-white shadow-xl rounded-2xl flex items-center justify-center mb-8 rotate-3 transform transition-transform group-hover:rotate-6">
                                <span className="text-4xl">🤖</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">No Paid Placements</h3>
                            <p className="text-[var(--color-surface-muted)] leading-relaxed">
                                Amazon search results are roughly 40% sponsored ads. PureFind strips all that away so the genuinely best product wins.
                            </p>
                        </div>

                        {/* Small Card Left */}
                        <div className="card p-10 relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500" />
                            <h3 className="text-xl font-bold mb-3">Real Prices & Ratings</h3>
                            <p className="text-[var(--color-surface-muted)] text-sm leading-relaxed">
                                Every recommendation is verified against live Amazon data. See real prices, real star ratings, and real review counts — not estimates.
                            </p>
                        </div>

                        {/* Small Card Right — Multi-search */}
                        <div className="card p-10 relative overflow-hidden group border-indigo-100">
                            <div className="absolute -left-4 -top-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors duration-500" />
                            <div className="text-2xl mb-3">🔄</div>
                            <h3 className="text-xl font-bold mb-3">Refine Until Perfect</h3>
                            <p className="text-[var(--color-surface-muted)] text-sm leading-relaxed">
                                Got results but want to go deeper? Search again right there — &quot;under $50,&quot; &quot;waterproof,&quot; &quot;for kids.&quot; Keep narrowing until it&apos;s perfect.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── LIVE DEALS TEASER ── */}
            <section className="py-28 px-4 sm:px-8 relative z-10">
                <div className="max-w-xl mx-auto text-center card p-12 sm:p-16 border-2 border-[var(--color-accent-muted)] bg-gradient-to-b from-white to-[var(--color-bg-elevated)]">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)] mb-6 animate-pulse">
                        Live Monitor
                    </p>
                    <h2 className="text-3xl font-black text-[var(--color-surface)] mb-6">
                        Today&apos;s Hottest Amazon Deals
                    </h2>
                    <p className="text-[var(--color-surface-muted)] mb-10 leading-relaxed text-lg">
                        We actively track massive price drops across Amazon to find deals that legitimately matter.
                    </p>
                    <Link href="/deals" className="btn-primary shadow-xl shadow-indigo-500/20 !px-10 py-4 text-base">
                        View Live Deals
                    </Link>
                </div>
            </section>

            {/* ── FAQ SECTION (SEO Content) ── */}
            <section className="py-20 px-4 sm:px-8 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-black text-center text-[var(--color-surface)] mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        {[
                            {
                                q: "How does PureFind find the best products?",
                                a: "PureFind uses AI to analyze thousands of Amazon products based on real reviews, ratings, and specifications — not sponsored placements. We verify every recommendation with live Amazon data including real prices and review counts.",
                            },
                            {
                                q: "Does PureFind cost anything?",
                                a: "PureFind is completely free to use. We earn a small affiliate commission (1-4.5%) when you purchase through our links, at no extra cost to you. You get the same Amazon price and Prime shipping.",
                            },
                            {
                                q: "Are PureFind's recommendations unbiased?",
                                a: "Yes. No seller pays for placement on PureFind. Our AI recommends products based on genuine quality, reviews, and value — not advertising spend. We show honest pros and cons for every product.",
                            },
                        ].map(({ q, a }) => (
                            <details key={q} className="card p-6 group">
                                <summary className="font-bold text-[var(--color-surface)] cursor-pointer list-none flex items-center justify-between">
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
            <section className="py-32 px-4 sm:px-8 bg-[var(--color-surface)] text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-accent)] to-transparent opacity-20" />
                <div className="max-w-xl mx-auto relative z-10">
                    <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight">
                        Stop endlessly scrolling.
                    </h2>
                    <p className="text-slate-300 text-xl font-medium mb-12">
                        Get the perfect recommendation in under 10 seconds. Start searching right now.
                    </p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="btn-amazon text-lg !px-12 py-5 shadow-2xl shadow-orange-500/20"
                    >
                        Search for a Product
                    </button>
                </div>
            </section>

        </div>
    );
}
