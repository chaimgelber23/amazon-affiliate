"use client";

import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

export default function HomePage() {
    return (
        <div className="relative min-h-screen overflow-hidden">

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

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight mb-8">
                        Sellers spam titles with keywords.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">We cut straight to the winner.</span>
                    </h1>

                    <p className="text-xl text-[var(--color-surface-muted)] mb-4 max-w-2xl mx-auto leading-relaxed font-medium">
                        Describe what you need in plain English. Our AI reads through the keyword-stuffed titles, fake reviews, and sponsored noise — and gives you the one product that actually wins.
                    </p>
                    <p className="text-base text-indigo-500 font-bold mb-10 max-w-xl mx-auto">
                        Not happy with the results? Just search again — narrower, broader, or totally different. No limit.
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
                            "No Keyword Spam",
                            "Search Again as Many Times as You Want",
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
                            <span className="text-6xl mb-6">🎯</span>
                            <h3 className="text-2xl font-bold mb-4">You ask. We perfectly translate.</h3>
                            <p className="text-[var(--color-surface-muted)] leading-relaxed max-w-md text-lg">
                                Just type "I need an ergonomic chair for back pain under $300." Our AI knows exactly which specs to hunt for, avoiding overpriced brands.
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
                            <h3 className="text-xl font-bold mb-3">Same Low Price</h3>
                            <p className="text-[var(--color-surface-muted)] text-sm leading-relaxed">
                                Click our link and buy on Amazon. You get the exact same price and Prime shipping. We earn a small affiliate fee.
                            </p>
                        </div>

                        {/* Small Card Right — Multi-search */}
                        <div className="card p-10 relative overflow-hidden group border-indigo-100">
                            <div className="absolute -left-4 -top-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors duration-500" />
                            <div className="text-2xl mb-3">🔄</div>
                            <h3 className="text-xl font-bold mb-3">Search Again, Get Better Results</h3>
                            <p className="text-[var(--color-surface-muted)] text-sm leading-relaxed">
                                Not quite right? Search again — add more detail, change your budget, or try a different angle. Results update instantly, no page reload.
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
                        Today's Hottest Lightning Deals
                    </h2>
                    <p className="text-[var(--color-surface-muted)] mb-10 leading-relaxed text-lg">
                        We actively track massive price drops across Amazon to find deals that legitimately matter.
                    </p>
                    <Link href="/deals" className="btn-primary shadow-xl shadow-indigo-500/20 !px-10 py-4 text-base">
                        View Live Deals
                    </Link>
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
                        Get the perfect recommendation in under 5 seconds. Start searching right now.
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
