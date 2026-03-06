"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
];

export function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Floating navbar — Pro Max style: ultra frosted glass */}
            <header className="fixed top-4 left-4 right-4 z-50 bg-white/60 backdrop-blur-2xl rounded-[20px] shadow-sm border border-[var(--color-border-glass)] transition-all">
                <div className="px-5 sm:px-8 h-16 flex items-center justify-between">

                    {/* Logo */}
                    <Link href="/" className="flex items-baseline group pt-1">
                        <span className="font-display text-2xl tracking-tight font-extrabold text-[var(--color-surface)] group-hover:opacity-80 transition-opacity duration-200">
                            Pure
                        </span>
                        <span className="font-display text-2xl tracking-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] to-purple-500 group-hover:opacity-80 transition-opacity duration-200">
                            Find
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-[15px] font-semibold text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/deals"
                            className="text-[15px] font-bold text-white bg-[var(--color-accent-gradient)] hover:shadow-lg hover:shadow-indigo-500/20 px-6 py-2.5 rounded-xl transition-all duration-300 flex items-center"
                        >
                            Live Deals
                        </Link>
                    </nav>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden text-[13px] font-bold uppercase tracking-widest text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] transition-colors duration-200 min-h-[44px] flex items-center justify-end"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? "Close" : "Menu"}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <nav className="md:hidden border-t border-[var(--color-border)] px-5 py-4 space-y-2 bg-white/90 backdrop-blur-3xl rounded-b-[20px]">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center text-[15px] font-bold text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] min-h-[44px] transition-colors"
                                onClick={() => setMobileOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/deals"
                            className="flex items-center justify-center text-[15px] font-bold text-white bg-[var(--color-accent-gradient)] shadow-md min-h-[44px] rounded-xl mt-4"
                            onClick={() => setMobileOpen(false)}
                        >
                            Live Deals
                        </Link>
                    </nav>
                )}
            </header>

            {/* Spacer so page content starts below the floating nav */}
            <div className="h-24" />
        </>
    );
}
