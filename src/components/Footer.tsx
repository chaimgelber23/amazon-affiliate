import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-[var(--color-bg-elevated)] border-t border-[var(--color-border)] mt-auto relative z-10">

            {/* Affiliate Disclosure */}
            <div className="bg-white/50 border-b border-[var(--color-border)] px-6 py-4">
                <p className="max-w-5xl mx-auto text-xs text-[var(--color-surface-dim)] font-medium text-center leading-relaxed">
                    <strong className="text-[var(--color-surface-muted)]">Affiliate Disclosure:</strong>{" "}
                    As an Amazon Associate I earn from qualifying purchases.
                    PureFind earns a small commission when you buy through our links, at no extra cost to you.
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Link href="/" className="inline-flex items-center mb-5 group pt-1 gap-1.5">
                            <span className="font-sans text-xl font-bold tracking-tight text-slate-800">
                                PureFind.
                            </span>
                        </Link>
                        <p className="text-sm font-medium text-[var(--color-surface-dim)] leading-relaxed max-w-sm">
                            The smartest way to shop on Amazon. We use sophisticated AI to instantly find the absolute best product for your specific needs.
                        </p>
                    </div>

                    {/* Navigate */}
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--color-surface-muted)] mb-5">
                            Navigate
                        </h4>
                        <ul className="space-y-4">
                            {[{ label: "Home", href: "/" }, { label: "About", href: "/about" }].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-[15px] font-semibold text-[var(--color-surface-dim)] hover:text-[var(--color-surface)] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--color-surface-muted)] mb-5">
                            Legal
                        </h4>
                        <ul className="space-y-4 text-[13px] font-medium text-[var(--color-surface-dim)] leading-relaxed">
                            <li>Amazon and the Amazon logo are trademarks of Amazon.com, Inc.</li>
                            <li>Prices and availability are accurate as of the time of search and are subject to change.</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[var(--color-surface-dim)]">
                    <p>&copy; {new Date().getFullYear()} PureFind. All rights reserved.</p>
                    <p className="flex items-center gap-1">Built with <span className="text-pink-500">♥</span> in NYC</p>
                </div>
            </div>
        </footer>
    );
}
