import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">

            {/* ── HERO ── */}
            <section className="pt-20 pb-24 px-4 sm:px-8 text-center">
                <div className="max-w-3xl mx-auto">

                    <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--color-border)] text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-surface-muted)] mb-10">
                        Free · No Sign-up · Works on Amazon
                    </div>

                    <h1 className="section-heading mb-7">
                        Find the best product<br />
                        <span className="text-[var(--color-accent)]">on Amazon — instantly.</span>
                    </h1>

                    <p className="text-lg text-[var(--color-surface-muted)] mb-14 max-w-lg mx-auto leading-relaxed">
                        Tell us what you need. We skip all the junk listings and show you what&apos;s actually worth buying.
                    </p>

                    <SearchBox />
                </div>
            </section>

            {/* ── TRUST BAR ── */}
            <section className="py-6 border-y border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <div className="max-w-4xl mx-auto px-4 sm:px-8">
                    <div className="flex flex-wrap justify-center text-sm text-[var(--color-surface-muted)] font-medium">
                        {[
                            "No sponsored results",
                            "Real review analysis",
                            "Best price on Amazon",
                            "Results in seconds",
                        ].map((text, i) => (
                            <span key={text} className="flex items-center">
                                <span className="px-5 py-1">{text}</span>
                                {i < 3 && <span className="text-[var(--color-border-strong)]">|</span>}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-28 px-4 sm:px-8">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center text-[var(--color-surface)] mb-20">
                        How it works
                    </h2>
                    <div className="space-y-14">
                        {[
                            {
                                num: "01",
                                title: "Type what you need",
                                desc: "Write it like you'd say it to a friend. \"Best laptop under $500\" works perfectly.",
                            },
                            {
                                num: "02",
                                title: "AI finds the winner",
                                desc: "We go through thousands of products and cut out the ones stuffed with fake words just to show up in searches.",
                            },
                            {
                                num: "03",
                                title: "Buy on Amazon",
                                desc: "Click through to Amazon. Same price. Same Prime shipping. We earn a small commission — that's how we keep this free.",
                            },
                        ].map(({ num, title, desc }) => (
                            <div key={num} className="flex gap-10 items-start">
                                <span className="text-5xl font-black text-[var(--color-border-strong)] leading-none flex-shrink-0 w-14 text-right select-none">
                                    {num}
                                </span>
                                <div className="pt-1">
                                    <h3 className="font-bold text-[var(--color-surface)] text-lg mb-2">{title}</h3>
                                    <p className="text-[var(--color-surface-muted)] leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── LIVE DEALS TEASER ── */}
            <section className="py-24 px-4 sm:px-8 bg-[var(--color-bg-card)] border-y border-[var(--color-border)]">
                <div className="max-w-xl mx-auto text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-accent)] mb-5">
                        Updated every minute
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-surface)] mb-5">
                        Today&apos;s hottest Amazon deals
                    </h2>
                    <p className="text-[var(--color-surface-muted)] mb-10 leading-relaxed">
                        We pull real deals the moment they go live and link straight to Amazon.
                    </p>
                    <Link href="/deals" className="btn-primary">
                        See All Live Deals
                    </Link>
                </div>
            </section>

            {/* ── WHY PUREFIND ── */}
            <section className="py-28 px-4 sm:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-surface)] mb-5">
                            Amazon is full of junk. We filter it out.
                        </h2>
                        <p className="text-[var(--color-surface-muted)] max-w-lg mx-auto leading-relaxed">
                            Sellers stuff product titles with random words just to show up in searches.
                            We ignore all that and surface what&apos;s genuinely worth buying.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                        {[
                            {
                                title: "No paid placements",
                                desc: "Our results are never paid for. We only show what the AI thinks is best.",
                            },
                            {
                                title: "Real reviews only",
                                desc: "We look at real buyer patterns — not just star counts that sellers can game.",
                            },
                            {
                                title: "Same Amazon price",
                                desc: "You pay exactly what Amazon charges. We earn a tiny commission on the sale.",
                            },
                        ].map(({ title, desc }) => (
                            <div key={title} className="bg-white px-8 py-10">
                                <h3 className="font-bold text-[var(--color-surface)] mb-3 text-sm uppercase tracking-wide">
                                    {title}
                                </h3>
                                <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BOTTOM CTA ── */}
            <section className="py-28 px-4 sm:px-8 bg-[var(--color-surface)] text-white text-center">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-5">
                        Ready to find the right product?
                    </h2>
                    <p className="text-white/50 mb-10 tracking-wide">
                        Free. No account needed. Just search and buy.
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-[var(--color-accent)] text-white font-bold text-sm uppercase tracking-widest px-12 py-4 rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors"
                    >
                        Start Searching
                    </Link>
                </div>
            </section>

        </div>
    );
}
