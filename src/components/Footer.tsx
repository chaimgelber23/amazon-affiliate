import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-[var(--color-bg-card)] border-t border-[var(--color-border)]">
            {/* Affiliate Disclosure — legally required */}
            <div className="bg-[var(--color-bg-elevated)] px-4 py-3 border-b border-[var(--color-border)]">
                <p className="max-w-4xl mx-auto text-[11px] text-[var(--color-surface-dim)] text-center leading-relaxed">
                    <strong className="text-[var(--color-surface-muted)]">Affiliate Disclosure:</strong> PureFind earns a small commission when you buy through our links, at no extra cost to you. We are a participant in the Amazon Services LLC Associates Program.
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                                <Zap className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-display font-bold text-lg text-[var(--color-surface)]">
                                Pure<span className="text-[var(--color-accent)]">Find</span>
                            </span>
                        </Link>
                        <p className="text-xs text-[var(--color-surface-dim)] leading-relaxed max-w-[240px]">
                            Search any product. We skip the junk and find what&apos;s actually worth buying on Amazon.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-surface-muted)] mb-3">Navigate</h4>
                        <ul className="space-y-2">
                            {[{ label: "Home", href: "/" }, { label: "Deals", href: "/deals" }, { label: "About", href: "/about" }].map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-[var(--color-surface-dim)] hover:text-[var(--color-surface)] transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-surface-muted)] mb-3">Legal</h4>
                        <ul className="space-y-2 text-sm text-[var(--color-surface-dim)]">
                            <li>Amazon and the Amazon logo are trademarks of Amazon.com, Inc.</li>
                            <li>Prices and availability subject to change.</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-surface-dim)]">
                    &copy; {new Date().getFullYear()} PureFind. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
