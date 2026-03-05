import { ShieldCheck, Zap, Search, Star, TrendingDown, Clock } from "lucide-react";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">

            {/* ── HERO ── */}
            <section className="pt-28 pb-16 px-4 sm:px-6 text-center bg-gradient-to-b from-orange-50 to-white">
                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-6">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                        Free · No Sign-up · Works on Amazon
                    </div>

                    <h1 className="section-heading mb-5">
                        Find the best product<br />
                        <span className="text-[var(--color-accent)]">on Amazon — instantly.</span>
                    </h1>

                    <p className="text-lg text-[var(--color-surface-muted)] mb-10 max-w-xl mx-auto leading-relaxed">
                        Tell us what you need. We skip all the junk and spam listings and show you what&apos;s actually worth buying.
                    </p>

                    <SearchBox />

                    <p className="mt-5 text-xs text-[var(--color-surface-dim)]">
                        Try: &quot;best air fryer under $60&quot; · &quot;waterproof hiking boots&quot; · &quot;laptop stand for desk&quot;
                    </p>
                </div>
            </section>

            {/* ── TRUST BAR ── */}
            <section className="py-6 border-y border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-12 text-sm text-[var(--color-surface-muted)]">
                        {[
                            { icon: ShieldCheck,  text: "No sponsored results" },
                            { icon: Star,         text: "Real review analysis" },
                            { icon: TrendingDown, text: "Best price on Amazon" },
                            { icon: Clock,        text: "Results in seconds" },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-2 font-medium">
                                <Icon className="w-4 h-4 text-[var(--color-accent)]" />
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-16 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-center text-[var(--color-surface)] mb-10">
                        How it works
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { icon: Search,      num: "1", title: "Type what you need",    desc: "Write it like you'd say it to a friend. \"Best laptop under $500\" works great." },
                            { icon: Zap,         num: "2", title: "AI finds the winner",   desc: "We go through thousands of products and cut out the ones stuffed with fake keywords just to show up." },
                            { icon: ShieldCheck, num: "3", title: "Buy on Amazon",         desc: "Click and buy on Amazon. Same price. Same Prime shipping. We earn a small fee." },
                        ].map(({ icon: Icon, num, title, desc }) => (
                            <div key={num} className="text-center p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                                <div className="w-12 h-12 mx-auto rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                                    <Icon className="w-5 h-5 text-[var(--color-accent)]" />
                                </div>
                                <div className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-widest mb-2">Step {num}</div>
                                <h3 className="font-bold text-[var(--color-surface)] mb-2">{title}</h3>
                                <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── LIVE DEALS TEASER ── */}
            <section className="py-16 px-4 sm:px-6 bg-gradient-to-r from-orange-50 to-amber-50 border-y border-orange-100">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-5">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                        Updated every minute
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-surface)] mb-3">
                        Today&apos;s hottest Amazon deals
                    </h2>
                    <p className="text-[var(--color-surface-muted)] mb-7 text-sm">
                        We pull real deals the moment they go live and link straight to Amazon.
                    </p>
                    <Link href="/deals" className="btn-primary text-base">
                        See All Live Deals →
                    </Link>
                </div>
            </section>

            {/* ── WHY PUREFIND ── */}
            <section className="py-16 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-[var(--color-surface)] mb-3">
                        Amazon is full of junk. We filter it out.
                    </h2>
                    <p className="text-[var(--color-surface-muted)] text-sm mb-10 max-w-xl mx-auto">
                        Sellers stuff product titles with random words just to show up in searches. We ignore all that and find what&apos;s actually good.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                        {[
                            { title: "No paid placements",  desc: "Our results are never paid for. We only show what the AI thinks is best." },
                            { title: "Real reviews only",   desc: "We look at real buyer patterns — not just star counts that sellers can game." },
                            { title: "Same Amazon price",   desc: "You pay exactly what Amazon charges. We earn a tiny commission on the sale." },
                        ].map(({ title, desc }) => (
                            <div key={title} className="p-5 rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
                                <h3 className="font-bold text-[var(--color-surface)] mb-2 text-sm">✓ {title}</h3>
                                <p className="text-xs text-[var(--color-surface-muted)] leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BOTTOM CTA ── */}
            <section className="py-16 px-4 sm:px-6 bg-[var(--color-accent)] text-white text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to find the right product?</h2>
                    <p className="text-orange-100 mb-7 text-sm">Free. No account needed. Just search and buy.</p>
                    <Link href="/" className="inline-flex items-center gap-2 bg-white text-[var(--color-accent)] font-bold text-base px-8 py-3.5 rounded-xl hover:bg-orange-50 transition-colors shadow-lg">
                        Start Searching
                    </Link>
                </div>
            </section>

        </div>
    );
}
