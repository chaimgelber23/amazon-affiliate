import type { Metadata } from "next";
import { ShieldCheck, Search, Eye, Heart, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About PureFind — How We Find the Best Amazon Products",
    description:
        "PureFind uses AI to cut through Amazon's SEO noise and sponsored placements. Learn how we find genuinely great products with real data — no paid recommendations.",
    alternates: {
        canonical: "/about",
    },
    openGraph: {
        title: "About PureFind — Honest AI Product Recommendations",
        description:
            "No paid placements. No fake reviews. Learn how PureFind's AI finds the best products on Amazon.",
    },
};

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-xs font-mono font-bold text-[var(--color-accent)] tracking-widest uppercase">
                        About
                    </span>
                    <h1 className="section-heading mt-2" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                        Amazon is broken.
                        <br />
                        <span className="text-[var(--color-accent)]">We&apos;re fixing it.</span>
                    </h1>
                    <p className="mt-6 text-base text-[var(--color-surface-muted)] max-w-xl mx-auto leading-relaxed">
                        Amazon sellers pour thousands of dollars into SEO-gaming their product
                        listings. Keyword-stuffed titles. Incentivized reviews. Sponsored placements
                        that look organic. The result? You can&apos;t tell what&apos;s actually good anymore.
                    </p>
                </div>

                {/* The pitch */}
                <div className="card p-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] mb-12">
                    <h2 className="text-xl font-bold mb-4">How PureFind works</h2>
                    <div className="space-y-6 text-sm text-[var(--color-surface-muted)] leading-relaxed">
                        <p>
                            <strong className="text-white">You search.</strong> Tell us what you&apos;re
                            looking for — &quot;best wireless headphones under $200&quot; or &quot;standing desk
                            for a small apartment.&quot; Anything.
                        </p>
                        <p>
                            <strong className="text-white">AI analyzes.</strong> Our AI reviews
                            thousands of products across Amazon, looking at real review patterns,
                            return rates, expert recommendations, and price history — not just
                            which seller paid the most for placement.
                        </p>
                        <p>
                            <strong className="text-white">You buy on Amazon.</strong> Click the link
                            and buy directly on your own Amazon account. Same prices. Same Prime
                            shipping. Same everything. We just helped you skip the noise.
                        </p>
                    </div>
                </div>

                {/* Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                    {[
                        {
                            icon: ShieldCheck,
                            title: "Independent",
                            desc: "No seller pays us. Our recommendations are based on data, not deals.",
                        },
                        {
                            icon: Eye,
                            title: "Transparent",
                            desc: "We earn a small Amazon commission when you buy through us. Same price for you.",
                        },
                        {
                            icon: Search,
                            title: "Comprehensive",
                            desc: "We search every category on Amazon. No product is off limits.",
                        },
                        {
                            icon: Heart,
                            title: "Honest",
                            desc: "Every product has cons. If something's popular but bad, we'll tell you.",
                        },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="card p-5 flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-[var(--color-accent)]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm mb-1">{title}</h3>
                                <p className="text-xs text-[var(--color-surface-muted)] leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Revenue transparency */}
                <div className="card p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] mb-12">
                    <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                        How we make money
                    </h3>
                    <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                        PureFind is part of the Amazon Associates program. When you click a product
                        link and buy something on Amazon, we earn a small referral fee (typically
                        1-4.5%). This costs you absolutely nothing extra — you pay the same Amazon
                        price. This commission is what keeps PureFind free to use and allows us to
                        keep improving the AI.
                    </p>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link href="/" className="btn-primary text-base px-8 py-3">
                        <Zap className="w-4 h-4 mr-2 inline" />
                        Start searching
                    </Link>
                </div>
            </div>
        </div>
    );
}
