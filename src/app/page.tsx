import { ShieldCheck, TrendingUp, Search, ArrowRight, Zap, Eye, Target } from "lucide-react";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* ==========================================
          HERO — Search-First
          ========================================== */}
            <section className="relative pt-32 pb-16 md:pt-44 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[85vh]">
                {/* Aurora Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] max-w-6xl h-[600px] opacity-40 pointer-events-none animate-aurora mix-blend-screen">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-purple)] to-[var(--color-pink)] blur-[120px] rounded-full opacity-60" />
                </div>

                {/* Grid overlay for texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30 pointer-events-none mask-image-radial-gradient" style={{ WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)' }} />

                <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[rgba(255,255,255,0.1)] text-xs font-semibold tracking-wide uppercase mb-10 animate-fade-in-up hover:border-[rgba(255,255,255,0.3)] transition-colors">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse shadow-[0_0_10px_var(--color-success)]" />
                        Powered by AI • Always free
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight mb-8 animate-fade-in-up stagger-1 drop-shadow-2xl">
                        Find the <span className="text-gradient">best product</span>
                        <br />on Amazon.
                    </h1>

                    <p className="text-lg md:text-xl text-[var(--color-surface-muted)] mb-14 max-w-2xl mx-auto animate-fade-in-up stagger-2 leading-relaxed">
                        Tell us what you need. Our AI cuts through the SEO noise and finds the product actually worth buying.
                    </p>

                    {/* THE SEARCH BOX — primary CTA */}
                    <div className="animate-fade-in-up stagger-3">
                        <SearchBox />
                    </div>
                </div>
            </section>

            {/* ==========================================
          HOW IT WORKS
          ========================================== */}
            <section className="py-20 px-4 sm:px-6 border-t border-[var(--color-border)]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-xs font-mono font-bold text-[var(--color-accent)] tracking-widest uppercase">
                            How it works
                        </span>
                        <h2 className="section-heading mt-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
                            Three steps. Zero noise.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Search,
                                step: "01",
                                title: "Search for anything",
                                desc: "Type what you're looking for. \"Best wireless mouse,\" \"air fryer for a family,\" anything.",
                            },
                            {
                                icon: Target,
                                step: "02",
                                title: "AI finds the best",
                                desc: "Our AI analyzes thousands of products, reviews, and data points to find the real winners.",
                            },
                            {
                                icon: Zap,
                                step: "03",
                                title: "Buy on Amazon",
                                desc: "Click the link and buy directly on your Amazon account. Same prices, same Prime shipping.",
                            },
                        ].map(({ icon: Icon, step, title, desc }) => (
                            <div key={step} className="relative text-center p-6">
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center mb-5">
                                    <Icon className="w-6 h-6 text-[var(--color-accent)]" />
                                </div>
                                <span className="text-xs font-mono font-bold text-[var(--color-accent)] tracking-widest">
                                    STEP {step}
                                </span>
                                <h3 className="font-semibold text-base mt-2 mb-2">{title}</h3>
                                <p className="text-sm text-[var(--color-surface-muted)] max-w-[260px] mx-auto">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==========================================
          WHY PUREFIND
          ========================================== */}
            <section className="py-20 px-4 sm:px-6 bg-[var(--color-bg-card)] border-y border-[var(--color-border)]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-xs font-mono font-bold text-[var(--color-accent)] tracking-widest uppercase">
                            Why PureFind
                        </span>
                        <h2 className="section-heading mt-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
                            Amazon is noisy. We&apos;re not.
                        </h2>
                        <p className="mt-4 text-sm text-[var(--color-surface-muted)] max-w-xl mx-auto">
                            Sellers spend thousands gaming Amazon&apos;s algorithm — keyword-stuffed titles, incentivized reviews, sponsored rankings. PureFind ignores all of that.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                            {
                                icon: ShieldCheck,
                                label: "Unbiased",
                                desc: "Our recommendations are based on quality, not who pays the most for placement.",
                            },
                            {
                                icon: TrendingUp,
                                label: "Data-Driven",
                                desc: "AI analyzes real review patterns, return rates, and expert consensus — not just star counts.",
                            },
                            {
                                icon: Eye,
                                label: "Transparent",
                                desc: "We earn a small commission when you buy through our links. Same Amazon price for you.",
                            },
                        ].map(({ icon: Icon, label, desc }) => (
                            <div key={label} className="flex flex-col items-center gap-3 text-center">
                                <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-[var(--color-accent)]" />
                                </div>
                                <h3 className="font-semibold text-sm">{label}</h3>
                                <p className="text-xs text-[var(--color-surface-muted)] max-w-[240px]">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==========================================
          BOTTOM CTA
          ========================================== */}
            <section className="py-24 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="section-heading" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
                        Ready to find the best?
                    </h2>
                    <p className="mt-4 section-sub mx-auto">
                        Stop wasting time scrolling through Amazon&apos;s noise. Just tell us what you need.
                    </p>
                    <div className="mt-8">
                        <Link href="#" className="btn-primary text-base px-8 py-4">
                            Search Now
                            <ArrowRight className="w-4 h-4 ml-2 inline" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
