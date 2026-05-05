import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-[var(--color-bg-warm)] border-t border-[var(--color-border)] mt-auto relative z-10">

            {/* Affiliate Disclosure — exact phrase required by Amazon Associates Operating Agreement */}
            <div className="bg-[var(--color-bg-card-solid)]/60 border-b border-[var(--color-border)] px-6 py-4">
                <p className="max-w-5xl mx-auto text-xs text-[var(--color-ink-muted)] font-medium text-center leading-relaxed">
                    <strong className="text-[var(--color-ink)]">Affiliate Disclosure:</strong>{" "}
                    As an Amazon Associate we earn from qualifying purchases.
                    PureFind earns a small commission when you buy through our links, at no extra cost to you.
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Link href="/" className="inline-flex items-baseline mb-5 group">
                            <span
                                className="font-display text-2xl font-medium tracking-[-0.03em] text-[var(--color-ink)]"
                                style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 144' }}
                            >
                                PureFind
                            </span>
                            <span className="text-[var(--color-rose)] font-display text-2xl font-medium">.</span>
                        </Link>
                        <p className="text-[15px] text-[var(--color-ink-muted)] leading-relaxed max-w-md">
                            The shortlist for whatever you're trying to buy on Amazon. We read past the keyword salad so you don't have to.
                        </p>
                    </div>

                    {/* Navigate */}
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-rose)] mb-5">
                            Navigate
                        </h4>
                        <ul className="space-y-3">
                            {[
                                { label: "Home", href: "/" },
                                { label: "About", href: "/about" },
                                { label: "How we rank", href: "/how-we-rank" },
                                { label: "Chrome extension", href: "/extension" },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-[14px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-plum)] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-rose)] mb-5">
                            Legal
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-[14px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-plum)] transition-colors"
                                >
                                    Privacy
                                </Link>
                            </li>
                            <li className="text-[12px] text-[var(--color-ink-dim)] leading-relaxed pt-1">
                                Amazon and the Amazon logo are trademarks of Amazon.com, Inc.
                            </li>
                            <li className="text-[12px] text-[var(--color-ink-dim)] leading-relaxed">
                                Prices and availability accurate at time of search; subject to change at Amazon.
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-14 pt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[var(--color-ink-dim)]">
                    <p>&copy; {new Date().getFullYear()} PureFind. All rights reserved.</p>
                    <p className="font-mono tnum">Built in NYC</p>
                </div>
            </div>
        </footer>
    );
}
