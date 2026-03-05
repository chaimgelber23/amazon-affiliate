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
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--color-border)]">
            <div className="max-w-6xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">

                {/* Logo — luxury text, no icon */}
                <Link href="/" className="flex items-baseline gap-0 group">
                    <span className="font-display text-xl uppercase tracking-[0.12em] font-light text-[var(--color-surface)] group-hover:opacity-80 transition-opacity">
                        Pure
                    </span>
                    <span className="font-display text-xl uppercase tracking-[0.12em] font-black text-[var(--color-accent)] group-hover:opacity-80 transition-opacity">
                        Find
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] transition-colors tracking-wide"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="/deals"
                        className="text-sm font-semibold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] px-5 py-2 rounded-lg transition-colors tracking-wide"
                    >
                        Live Deals
                    </Link>
                </nav>

                {/* Mobile toggle — no icon */}
                <button
                    className="md:hidden text-xs font-bold uppercase tracking-widest text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? "Close" : "Menu"}
                </button>
            </div>

            {mobileOpen && (
                <nav className="md:hidden border-t border-[var(--color-border)] bg-white px-6 py-4 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="block text-sm text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] py-3 transition-colors tracking-wide"
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="/deals"
                        className="block text-sm font-semibold text-[var(--color-accent)] py-3 tracking-wide"
                        onClick={() => setMobileOpen(false)}
                    >
                        Live Deals
                    </Link>
                </nav>
            )}
        </header>
    );
}
