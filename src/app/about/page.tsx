import type { Metadata } from "next";
import { ShieldCheck, Search, Eye, Heart, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About ProductFindAI — Save time on Amazon research",
    description:
        "ProductFindAI is a small AI tool that gives you a curated shortlist of Amazon products so you spend less time digging through listings. We earn an Amazon affiliate commission when you buy through our links — same price for you.",
    alternates: {
        canonical: "/about",
    },
    openGraph: {
        title: "About ProductFindAI — Save time on Amazon research",
        description:
            "A small AI tool that turns 'standing desk under $300' into a six-pick shortlist with a one-line take on each.",
    },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://productfindai.com";

const ABOUT_FAQS: { q: string; a: string }[] = [
    {
        q: "How is ProductFindAI different from Wirecutter or NerdWallet?",
        a: "Wirecutter and NerdWallet rank a small fixed set of products their editors have tested. ProductFindAI generates a fresh shortlist from any Amazon search you type, in any category, using AI plus live Amazon Product Advertising API data. We don't claim to test products in a lab — we filter the noise.",
    },
    {
        q: "Are the recommendations independent or paid?",
        a: "Independent. No seller pays for placement. ProductFindAI earns a standard Amazon Associates referral fee (typically 1–4.5%) when you buy through our links — the same Amazon affiliate program any blog or review site uses. The price you pay on Amazon is identical with or without our link.",
    },
    {
        q: "Do you actually verify the prices and ratings, or is it just AI making them up?",
        a: "Every product on the results page is verified live against Amazon's Product Advertising API at search time — the title, price, image, star rating, and review count come from Amazon directly, not from the AI. The AI's job is picking which products to show; the data on the card is real.",
    },
    {
        q: "What does the Chrome extension do?",
        a: "The free Chrome extension overlays a one-line take on Amazon listings as you browse. It tells you whether a product is over-rated for the price, under-rated, or fairly priced based on the same AI signal we use to build shortlists. You don't need an account.",
    },
    {
        q: "Is ProductFindAI free?",
        a: "Yes. Search is free, the Chrome extension is free, and there's nothing to sign up for. The Amazon Associates referral fee on purchases is what funds the site.",
    },
    {
        q: "Why don't you cover Walmart, Target, or other retailers?",
        a: "Amazon has the largest product catalog and the most consistent live data feed, so we focused there to keep the verification step honest. Adding other retailers would mean introducing data sources of varying reliability — for now, ProductFindAI is Amazon-only by design.",
    },
];

function AboutJsonLd() {
    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: SITE_URL,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "About",
                item: `${SITE_URL}/about`,
            },
        ],
    };

    const faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: ABOUT_FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
                "@type": "Answer",
                text: f.a,
            },
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
            />
        </>
    );
}

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
            <AboutJsonLd />
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-rose)] inline-flex items-center gap-2">
                        <span className="w-5 h-px bg-[var(--color-rose)]" aria-hidden="true" />
                        About
                    </p>
                    <h1
                        className="font-display font-medium text-[var(--color-ink)] tracking-[-0.035em] leading-[1.0] mt-5"
                        style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)", fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 144' }}
                    >
                        Let us help you save{" "}
                        <span className="italic text-[var(--color-plum)]">time on research</span>.
                    </h1>
                    <p className="mt-7 text-base sm:text-lg text-[var(--color-ink-muted)] max-w-xl mx-auto leading-relaxed">
                        Finding the right product on Amazon can be difficult. ProductFindAI reads through the listings in your category and hands you a six-pick shortlist with a one-line take on each — so you spend a minute deciding instead of an afternoon.
                    </p>
                </div>

                {/* The pitch */}
                <div className="card p-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] mb-12">
                    <h2 className="text-xl font-bold mb-4">How ProductFindAI works</h2>
                    <div className="space-y-6 text-sm text-[var(--color-surface-muted)] leading-relaxed">
                        <p>
                            <strong className="text-[var(--color-ink)]">You search.</strong> Tell us what you&apos;re
                            looking for — &quot;best wireless headphones under $200&quot; or &quot;standing desk
                            for a small apartment.&quot; Anything.
                        </p>
                        <p>
                            <strong className="text-[var(--color-ink)]">AI shortlists.</strong> Our AI builds
                            a shortlist of products in your category and ranks them by what it
                            knows about typical specs, common complaints, and reasonable price
                            bands. We then verify each pick against live Amazon data (title,
                            price, image, rating, review count) through Amazon&apos;s official
                            Product Advertising API before showing it to you.
                        </p>
                        <p className="text-xs text-[var(--color-surface-dim)] italic">
                            What the AI is not: a price tracker, a review aggregator, or a
                            return-rate database. It&apos;s a shortlist generator, verified
                            against live PA-API data at search time.
                        </p>
                        <p>
                            <strong className="text-[var(--color-ink)]">You buy on Amazon.</strong> Click the link
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
                        ProductFindAI is part of the Amazon Associates program. When you click a product
                        link and buy something on Amazon, we earn a small referral fee (typically
                        1-4.5%). This costs you absolutely nothing extra — you pay the same Amazon
                        price. This commission is what keeps ProductFindAI free to use and allows us to
                        keep improving the AI.
                    </p>
                </div>

                {/* FAQ */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-[var(--color-ink)]">
                        Common questions
                    </h2>
                    <div className="space-y-4">
                        {ABOUT_FAQS.map((f) => (
                            <details
                                key={f.q}
                                className="card p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] group"
                            >
                                <summary className="cursor-pointer font-semibold text-sm text-[var(--color-ink)] list-none flex items-center justify-between">
                                    <span>{f.q}</span>
                                    <span className="text-[var(--color-surface-dim)] group-open:rotate-45 transition-transform">+</span>
                                </summary>
                                <p className="mt-4 text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                    {f.a}
                                </p>
                            </details>
                        ))}
                    </div>
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
