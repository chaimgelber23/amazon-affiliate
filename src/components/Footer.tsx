import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-[var(--color-bg-card)] border-t border-[var(--color-border)]">

            {/* Affiliate Disclosure */}
            <div className="border-b border-[var(--color-border)] px-6 py-3">
                <p className="max-w-4xl mx-auto text-[11px] text-[var(--color-surface-dim)] text-center leading-relaxed">
                    <strong className="text-[var(--color-surface-muted)]">Affiliate Disclosure:</strong>{" "}
                    As an Amazon Associate I earn from qualifying purchases.
                    PureFind earns a small commission when you buy through our links, at no extra cost to you.
                    We are a participant in the Amazon Services LLC Associates Program.
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

                    {/* Brand */}
                    <div>
                        <Link href="/" className="inline-flex items-baseline gap-0 mb-4">
                            <span className="font-display text-lg uppercase tracking-[0.12em] font-light text-[var(--color-surface)]">
                                Pure
                            </span>
                            <span className="font-display text-lg uppercase tracking-[0.12em] font-black text-[var(--color-accent)]">
                                Find
                            </span>
                        </Link>
                        <p className="text-xs text-[var(--color-surface-dim)] leading-relaxed max-w-[220px]">
                            Search any product. We skip the junk and show you what&apos;s worth buying on Amazon.
                        </p>
                    </div>

                    {/* Navigate */}
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-surface-muted)] mb-4">
                            Navigate
                        </h4>
                        <ul className="space-y-3">
                            {[{ label: "Home", href: "/" }, { label: "Deals", href: "/deals" }, { label: "About", href: "/about" }].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-[var(--color-surface-dim)] hover:text-[var(--color-surface)] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-surface-muted)] mb-4">
                            Legal
                        </h4>
                        <ul className="space-y-3 text-xs text-[var(--color-surface-dim)] leading-relaxed">
                            <li>Amazon and the Amazon logo are trademarks of Amazon.com, Inc.</li>
                            <li>Prices and availability subject to change.</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-surface-dim)]">
                    &copy; {new Date().getFullYear()} PureFind. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
