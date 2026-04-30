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
            "Find good products on Amazon without sponsored ads, listicle farms, or top-10 filler. Type what you want, get the pick.",
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
        <div className="relative min-h-screen overflow-hidden">
            <HomeJsonLd />

            {/* Background mesh orbs */}
            <div className="mesh-orb w-[600px] h-[600px] bg-indigo-500/20 top-[-200px] left-1/2 -translate-x-1/2 animate-float" />
            <div className="mesh-orb w-[400px] h-[400px] bg-amber-400/20 top-[100px] right-[-100px] stagger-2 animate-float" />

            {/* ── HERO ── */}
            <section className="relative pt-16 sm:pt-24 pb-20 px-4 sm:px-8 text-center animate-fade-in-up">
                <div className="max-w-4xl mx-auto relative z-10">

                    <h1 className="font-display text-[40px] sm:text-6xl md:text-[72px] font-black text-slate-900 tracking-tight leading-[1.02] mb-7">
                        Find a good{" "}
                        <RotatingText
                            words={ROTATING_QUERIES}
                            className="text-[var(--color-accent)]"
                        />
                        .
                        <br />
                        <span className="text-slate-400 font-bold">Skip the search.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-[var(--color-surface-muted)] mb-9 max-w-2xl mx-auto leading-relaxed">
                        Amazon&apos;s top results are sponsored slots. Google&apos;s top results are listicle farms paid by the products they rank. PureFind cuts to the actual pick.
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

            {/* ── CONTRAST BLOCK ── */}
            <section className="py-24 sm:py-36 px-4 sm:px-8 relative z-10">
                <div className="mesh-orb w-[400px] h-[400px] bg-pink-500/10 top-[20%] left-[-150px] animate-float stagger-3" />

                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[var(--color-surface)] tracking-tight leading-[1.05] mb-10">
                        Finding a good product
                        <br />
                        <span className="text-slate-400">usually wastes your time.</span>
                    </h2>

                    <p className="text-lg sm:text-xl text-[var(--color-surface-muted)] leading-relaxed mb-10">
                        Amazon search opens with sponsored slots. Google&apos;s first page is ads, then top-10 sites paid by the products they review. Influencer roundups are mostly paid placements. The reviews you trust are gamed.
                    </p>

                    <p className="font-display text-xl sm:text-2xl font-bold text-[var(--color-surface)] leading-snug max-w-2xl mx-auto">
                        PureFind doesn&apos;t run any of that.<br className="hidden sm:block" />{" "}
                        <span className="text-[var(--color-accent)]">Type what you want. Get the pick. Buy it on Amazon.</span>
                    </p>
                </div>
            </section>

        </div>
    );
}
