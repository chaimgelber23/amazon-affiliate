import Link from "next/link";
import { BrandLockup } from "./BrandLockup";

export function Footer() {
    return (
        <footer className="mt-auto border-t border-[var(--color-border)] relative z-10">

            {/* Affiliate Disclosure - exact phrase required by Amazon Associates Operating Agreement */}
            <div className="bg-[var(--color-bg-warm)] border-b border-[var(--color-border)] px-6 py-4">
                <p className="max-w-5xl mx-auto text-xs text-[var(--color-ink-muted)] font-medium text-center leading-relaxed">
                    <strong className="text-[var(--color-ink)]">Affiliate Disclosure:</strong>{" "}
                    As an Amazon Associate I earn from qualifying purchases.
                    ProductFindAI may earn a commission when you buy through links on this site, at no extra cost to you.
                </p>
            </div>

            <div className="relative overflow-hidden bg-[var(--color-brand-navy-deep)] text-white">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-80"
                    style={{
                        background:
                            "radial-gradient(circle at 12% 20%, rgba(0, 66, 160, 0.38), transparent 34%), radial-gradient(circle at 88% 82%, rgba(254, 114, 29, 0.12), transparent 30%)",
                    }}
                />

                <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                        {/* Brand */}
                        <div className="md:col-span-2">
                            <Link
                                href="/"
                                aria-label="ProductFindAI home"
                                className="mb-6 inline-flex rounded-xl transition-opacity hover:opacity-85"
                            >
                                <BrandLockup inverted size="footer" />
                            </Link>
                            <p className="text-[15px] text-white/70 leading-relaxed max-w-md">
                                Official-listing shortlists when available, and an honest Amazon fallback when not. No sponsored slots, no paid placement.
                            </p>
                        </div>

                        {/* Navigate */}
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-cart-orange)] mb-5">
                                Navigate
                            </h4>
                            <ul className="space-y-3">
                                {[
                                    { label: "Home", href: "/" },
                                    { label: "About", href: "/about" },
                                    { label: "How it works", href: "/#how-it-works" },
                                ].map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-[14px] font-medium text-white/65 hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-cart-orange)] mb-5">
                                Legal
                            </h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        href="/privacy"
                                        className="text-[14px] font-medium text-white/65 hover:text-white transition-colors"
                                    >
                                        Privacy
                                    </Link>
                                </li>
                                <li className="text-[12px] text-white/45 leading-relaxed pt-1">
                                    Amazon and the Amazon logo are trademarks of Amazon.com, Inc.
                                </li>
                                <li className="text-[12px] text-white/45 leading-relaxed">
                                    Certain content that appears on this site comes from Amazon. This content is provided &quot;as is&quot; and is subject to change or removal at any time.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-white/45">
                        <p>&copy; {new Date().getFullYear()} ProductFindAI. All rights reserved.</p>
                        <p className="font-mono tnum">Built in NYC</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
