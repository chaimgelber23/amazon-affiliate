"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
    { label: "Home", href: "/" },
    { label: "Deals", href: "/deals" },
    { label: "About", href: "/about" },
];

export function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Floating navbar — ui-ux-pro-max rule: top-4 left-4 right-4 spacing */}
            <header className="fixed top-3 left-3 right-3 z-50 bg-[var(--color-bg-card)]/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[var(--color-border)] transition-all">
                <div className="px-4 sm:px-6 h-14 flex items-center justify-between">

                    {/* Logo — flush left, no icon, luxury type */}
                    <Link href="/" className="flex items-baseline group">
                        <span className="font-display text-xl uppercase tracking-[0.12em] font-light text-[var(--color-surface)] group-hover:opacity-70 transition-opacity duration-200">
                            Pure
                        </span>
                        <span className="font-display text-xl uppercase tracking-[0.12em] font-black text-[var(--color-accent)] group-hover:opacity-70 transition-opacity duration-200">
                            Find
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] transition-colors duration-200 tracking-wide"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/deals"
                            className="text-sm font-semibold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] px-5 py-2.5 rounded-xl transition-colors duration-200 tracking-wide min-h-[44px] flex items-center cursor-pointer"
                        >
                            Live Deals
                        </Link>
                    </nav>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden text-xs font-bold uppercase tracking-widest text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-end cursor-pointer"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? "Close" : "Menu"}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <nav className="md:hidden border-t border-[var(--color-border)] px-4 py-3 space-y-0.5">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center text-sm text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] min-h-[44px] transition-colors duration-200 tracking-wide cursor-pointer"
                                onClick={() => setMobileOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/deals"
                            className="flex items-center text-sm font-semibold text-[var(--color-accent)] min-h-[44px] tracking-wide cursor-pointer"
                            onClick={() => setMobileOpen(false)}
                        >
                            Live Deals
                        </Link>
                    </nav>
                )}
            </header>

            {/* Spacer so page content starts below the floating nav */}
            <div className="h-20" />
        </>
    );
}
