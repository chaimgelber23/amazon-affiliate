import type { Metadata } from "next";
import { ShieldCheck, Search, Eye, Heart, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About ProductFindAI - Save time on Amazon research",
    description:
        "ProductFindAI gives you a curated shortlist of Amazon products so you spend less time digging through listings. As an Amazon Associate I earn from qualifying purchases.",
    alternates: {
        canonical: "/about",
    },
    openGraph: {
        title: "About ProductFindAI - Save time on Amazon research",
        description:
            "When official catalog access is available, ProductFindAI turns 'standing desk under $300' into an evidence-backed Amazon shortlist.",
    },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://productfindai.com";

const ABOUT_FAQS: { q: string; a: string }[] = [
    {
        q: "How is ProductFindAI different from Wirecutter or NerdWallet?",
        a: "Wirecutter and NerdWallet publish fixed editorial picks. When official catalog access is available, ProductFindAI interprets the search you type, checks exact listings through Amazon's official product API, and ranks the evidence-backed matches against your requirements. If that access is unavailable, we do not invent a shortlist. We offer an honestly labeled Amazon search instead.",
    },
    {
        q: "Are the recommendations independent or paid?",
        a: "No seller pays for placement. As an Amazon Associate I earn from qualifying purchases. ProductFindAI may earn a referral fee when you buy through links on this site, at no extra cost to you.",
    },
    {
        q: "Does the AI make up prices or ratings?",
        a: "No. We show a price only when Amazon's official product API returns it for that exact listing at search time. The current Creators API does not supply customer ratings, so ProductFindAI sends you to Amazon to confirm ratings and other purchase details.",
    },
    {
        q: "Can I refine a search after I see results?",
        a: "Yes. Search once, then add details in the same search bar. ProductFindAI keeps the first search in mind and updates the same list. You can also start fresh anytime.",
    },
    {
        q: "Is ProductFindAI free?",
        a: "Yes. Search is free and there is nothing to sign up for. Amazon Associates referral fees help fund the site.",
    },
    {
        q: "Why don't you cover Walmart, Target, or other retailers?",
        a: "ProductFindAI is focused on Amazon so the links and product data can stay tied to one official source. Other retailers may come later, but this site is Amazon-only today.",
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
                        Finding the right product on Amazon can be difficult. When official catalog access is available, ProductFindAI checks the listings returned for your request and hands you a focused ranked list. When it is unavailable, we say so and do not pretend products were checked.
                    </p>
                </div>

                {/* The pitch */}
                <div className="card p-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] mb-12">
                    <h2 className="text-xl font-bold mb-4">How ProductFindAI works</h2>
                    <div className="space-y-6 text-sm text-[var(--color-surface-muted)] leading-relaxed">
                        <p>
                            <strong className="text-[var(--color-ink)]">You search.</strong> Tell us what you&apos;re
                            looking for: &quot;best wireless headphones under $200&quot; or &quot;standing desk
                            for a small apartment.&quot; Plain-language searches work.
                        </p>
                        <p>
                            <strong className="text-[var(--color-ink)]">Official data, when available.</strong> AI helps
                            interpret your request and plan a focused catalog query. Amazon&apos;s official
                            product API supplies the exact candidate listings, titles, images, available
                            prices, and feature fields. ProductFindAI then applies your requirements and
                            ranks the verified matches locally.
                        </p>
                        <p className="text-xs text-[var(--color-surface-dim)] italic">
                            ProductFindAI is a shortlist generator. It does not track prices,
                            aggregate reviews, or collect return-rate data.
                        </p>
                        <p>
                            <strong className="text-[var(--color-ink)]">You buy on Amazon.</strong> Click the link
                            and buy directly on your own Amazon account. Amazon controls the price,
                            shipping, returns, and customer service.
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
                            desc: "As an Amazon Associate I earn from qualifying purchases, at no extra cost to you.",
                        },
                        {
                            icon: Search,
                            title: "Comprehensive",
                            desc: "Use plain-language searches across everyday Amazon categories.",
                        },
                        {
                            icon: Heart,
                            title: "Honest",
                            desc: "We show a tradeoff only when the exact listing supports it. Otherwise, we say none was verified.",
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
                        ProductFindAI is part of the Amazon Associates program. As an Amazon Associate I
                        earn from qualifying purchases. ProductFindAI may earn a referral fee when you buy
                        through links on this site, at no extra cost to you. The commission helps keep
                        ProductFindAI free to use.
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
                                    <span
                                        className="text-[var(--color-surface-dim)] group-open:rotate-45 transition-transform"
                                        aria-hidden="true"
                                    >
                                        +
                                    </span>
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
