import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-[rgba(255,255,255,0.05)] bg-[var(--color-bg)]/80 backdrop-blur-lg pt-4">
            {/* Affiliate Disclosure — LEGALLY REQUIRED */}
            <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.03)] to-transparent">
                <p className="max-w-4xl mx-auto text-[10px] text-[var(--color-surface-dim)] text-center leading-relaxed font-medium">
                    <strong className="text-[var(--color-surface-muted)]">Affiliate Disclosure:</strong> PureFind is a participant in the Amazon
                    Services LLC Associates Program. When you click links on our site and make a
                    purchase, we may earn a commission at no extra cost to you. This helps us keep
                    the site running and free to use.
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-4 group">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-purple)] flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)] group-hover:scale-105 transition-transform duration-300">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight text-white">
                                Pure<span className="text-[var(--color-accent)]">Find</span>
                            </span>
                        </Link>
                        <p className="text-xs text-[var(--color-surface-dim)] leading-relaxed max-w-[260px]">
                            Search for any product. We cut through Amazon&apos;s SEO noise and find
                            the option actually worth buying.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-surface-muted)] mb-4">
                            Navigate
                        </h4>
                        <ul className="space-y-2">
                            {[
                                { label: "Home", href: "/" },
                                { label: "Deals", href: "/deals" },
                                { label: "About", href: "/about" },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-[var(--color-surface-dim)] hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-surface-muted)] mb-4">
                            Legal
                        </h4>
                        <ul className="space-y-2">
                            <li className="text-sm text-[var(--color-surface-dim)]">
                                Amazon and the Amazon logo are trademarks of Amazon.com, Inc.
                            </li>
                            <li className="text-sm text-[var(--color-surface-dim)]">
                                Product prices and availability are subject to change.
                            </li>
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
