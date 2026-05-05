import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "How PureFind ranks the picks",
    description:
        "The methodology behind PureFind's six-to-eight pick shortlists. What signals we use, what we don't, and where AI ends and Amazon's own data begins.",
    alternates: {
        canonical: "/how-we-rank",
    },
    openGraph: {
        title: "How PureFind ranks the picks",
        description:
            "We don't physically test products. Here's exactly what we do — and what stops us from gaming the rankings.",
    },
};

const FAQS = [
    {
        q: "Do you physically test products?",
        a: "No. We don't run a lab. We don't unbox 47 standing desks. If a site claims to test every product they recommend, ask them how that scales — usually it doesn't, and the testing is a marketing claim. We'd rather be honest about what we do.",
    },
    {
        q: "Why trust an AI ranking instead of human reviewers?",
        a: "We don't ask you to. The AI proposes the shortlist; the ranking is decided by Amazon's own signals (review count, average rating) plus a price-presence check. The AI's job is finding the candidates — the order comes from real buyers.",
    },
    {
        q: "Are any picks paid for or sponsored?",
        a: "No paid placement. No vendor pays to be in our shortlist. The only money flowing is the Amazon Associates commission we earn when you buy through our links — and that's the same percentage regardless of which product on Amazon you click.",
    },
    {
        q: "How fresh are the prices?",
        a: "Amazon prices are cached for one hour to stay inside Amazon's API rate limits. The AI shortlist itself is cached for 24 hours per query — we re-run it daily so picks don't go stale.",
    },
    {
        q: "What stops you from recommending bad products to earn commission?",
        a: "The reranker filters out products with under 100 reviews and under 4.0 stars. A bad product with five reviews can't be commission-bait because it never makes the shortlist. We'd rather earn nothing than ship a broken pick.",
    },
];

function Schema() {
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "How PureFind ranks the picks",
        description:
            "The methodology behind PureFind's six-to-eight pick shortlists. What signals we use, what we don't, and where AI ends and Amazon's own data begins.",
        author: {
            "@type": "Organization",
            name: "PureFind",
        },
        publisher: {
            "@type": "Organization",
            name: "PureFind",
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": "https://purefind.vercel.app/how-we-rank",
        },
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: {
                "@type": "Answer",
                text: a,
            },
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
        </>
    );
}

export default function HowWeRankPage() {
    return (
        <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6">
            <Schema />

            <article className="max-w-3xl mx-auto">
                {/* Header */}
                <header className="text-center mb-16">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-rose)] inline-flex items-center gap-2">
                        <span className="w-5 h-px bg-[var(--color-rose)]" aria-hidden="true" />
                        Methodology
                    </p>
                    <h1
                        className="font-display font-medium text-[var(--color-ink)] tracking-[-0.035em] leading-[1.0] mt-5"
                        style={{
                            fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                            fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 144',
                        }}
                    >
                        How PureFind{" "}
                        <span className="italic text-[var(--color-plum)]">ranks the picks</span>.
                    </h1>
                    <p className="mt-7 text-base sm:text-lg text-[var(--color-ink-muted)] max-w-xl mx-auto leading-relaxed">
                        The honest version. What signals we use, what we don&apos;t, and where the AI ends and Amazon&apos;s own data begins.
                    </p>
                </header>

                {/* The honest truth */}
                <section className="mb-14">
                    <h2 className="font-display text-3xl sm:text-4xl font-medium text-[var(--color-ink)] tracking-[-0.03em] leading-[1.05] mb-5">
                        We don&apos;t physically test products.
                    </h2>
                    <div className="space-y-5 text-[15px] sm:text-base text-[var(--color-ink-muted)] leading-relaxed">
                        <p>
                            Sites that claim to test every product they recommend are usually overstating it. PureFind is a small operation. We don&apos;t have a lab, and we&apos;d rather be straight about that than pretend.
                        </p>
                        <p>
                            What we <em>do</em> is read past the keyword-stuffed listings — the Amazon search results most shoppers give up on after page two — and surface the products real buyers keep coming back to. The AI proposes the shortlist. Amazon&apos;s own data decides the order.
                        </p>
                    </div>
                </section>

                {/* The signal stack */}
                <section className="mb-14">
                    <h2 className="font-display text-3xl sm:text-4xl font-medium text-[var(--color-ink)] tracking-[-0.03em] leading-[1.05] mb-6">
                        The signal stack.
                    </h2>

                    <ol className="space-y-7 text-[15px] sm:text-base text-[var(--color-ink-muted)] leading-relaxed">
                        <li>
                            <p className="font-mono tnum text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-plum)] mb-2">
                                Step one — candidate generation
                            </p>
                            <p>
                                You type a query. We send it through a Gemini model with Google Search grounding turned on, which means the AI is reading current web pages — not just relying on its training data. It returns six to eight candidate products with a confidence score and a tier label (budget / mid / premium).
                            </p>
                        </li>
                        <li>
                            <p className="font-mono tnum text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-rose)] mb-2">
                                Step two — Amazon enrichment
                            </p>
                            <p>
                                Every candidate gets looked up against Amazon&apos;s Product Advertising API. We pull the real review count, real average rating, real current price, real product photo. The AI never invents an ASIN — those hallucinate and break links — so each candidate&apos;s title becomes the join key into Amazon&apos;s catalog.
                            </p>
                        </li>
                        <li>
                            <p className="font-mono tnum text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700 mb-2">
                                Step three — the reranker
                            </p>
                            <p>
                                The order you see isn&apos;t the AI&apos;s order. A reranker scores each candidate by review count × average rating × price-presence. Anything under 100 reviews drops. Anything under 4.0 stars drops. The AI&apos;s original ranking enters as a 0.5-weight tiebreaker — it influences ties, never overrides Amazon&apos;s real-world signal.
                            </p>
                        </li>
                    </ol>
                </section>

                {/* The cache */}
                <section className="card p-7 sm:p-8 bg-[var(--color-bg-card-solid)] border border-[var(--color-border-strong)] rounded-2xl mb-14">
                    <h2 className="text-xl font-bold text-[var(--color-ink)] mb-4">
                        Why the prices feel current.
                    </h2>
                    <div className="space-y-4 text-[15px] text-[var(--color-ink-muted)] leading-relaxed">
                        <p>
                            Amazon&apos;s API rate-limits hard, so prices are cached for one hour. Within that window you see the same number Amazon would have shown you on Amazon. If you click through and the price has moved, that&apos;s the live Amazon page recalculating — not a stale number from us.
                        </p>
                        <p>
                            The AI shortlist itself caches for 24 hours per query. Re-runs happen daily so picks don&apos;t calcify around a season-old recommendation.
                        </p>
                    </div>
                </section>

                {/* What we won't do */}
                <section className="mb-16">
                    <h2 className="font-display text-3xl sm:text-4xl font-medium text-[var(--color-ink)] tracking-[-0.03em] leading-[1.05] mb-6">
                        What we won&apos;t do.
                    </h2>
                    <ul className="space-y-4 text-[15px] sm:text-base text-[var(--color-ink-muted)] leading-relaxed">
                        <li>
                            <strong className="text-[var(--color-ink)]">No paid placement.</strong> No vendor pays to be in a shortlist. The only money flowing is the Amazon Associates commission, which is the same percentage on every product on Amazon — there&apos;s no bias to recommend one thing over another for a kickback.
                        </li>
                        <li>
                            <strong className="text-[var(--color-ink)]">No fake testing claims.</strong> If we haven&apos;t held it, we won&apos;t say we have. The methodology page you&apos;re reading is the testing claim.
                        </li>
                        <li>
                            <strong className="text-[var(--color-ink)]">No commission-bait products.</strong> The under-100-reviews and under-4.0-stars filters apply before the reranker can promote anything. A bad product with five reviews can&apos;t earn its way into the shortlist no matter what the AI thinks.
                        </li>
                        <li>
                            <strong className="text-[var(--color-ink)]">No data harvesting.</strong> We log the search query for analytics. We don&apos;t track you across the web. Full detail on the{" "}
                            <Link href="/privacy" className="text-[var(--color-plum)] underline-offset-2 hover:underline">
                                privacy page
                            </Link>
                            .
                        </li>
                    </ul>
                </section>

                {/* FAQ */}
                <section className="mb-16">
                    <h2 className="font-display text-3xl sm:text-4xl font-medium text-[var(--color-ink)] tracking-[-0.03em] leading-[1.05] mb-8">
                        Common questions.
                    </h2>
                    <dl className="space-y-7">
                        {FAQS.map(({ q, a }) => (
                            <div key={q}>
                                <dt className="text-[var(--color-ink)] font-semibold text-base sm:text-lg leading-snug mb-2">
                                    {q}
                                </dt>
                                <dd className="text-[15px] text-[var(--color-ink-muted)] leading-relaxed">
                                    {a}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* CTA back to product */}
                <section className="text-center pt-6 border-t border-[var(--color-border)]">
                    <p className="text-sm text-[var(--color-ink-dim)] mb-4">
                        That&apos;s the whole methodology. Now —
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 font-semibold text-[var(--color-ink)] bg-[var(--color-bg-card-solid)] border border-[var(--color-border-strong)] hover:border-[var(--color-plum)] hover:text-[var(--color-plum)] px-6 py-3 rounded-full transition-all"
                    >
                        Try a search
                    </Link>
                </section>
            </article>
        </div>
    );
}
