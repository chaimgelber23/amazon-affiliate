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
            {/* Floating navbar */}
            <header className="fixed top-4 left-4 right-4 z-50 bg-white/60 backdrop-blur-2xl rounded-[20px] shadow-sm border border-[var(--color-border-glass)] transition-all">
                <div className="px-5 sm:px-8 h-16 flex items-center justify-between">

                    {/* Logo */}
                    <Link href="/" className="flex items-center group gap-1.5">
                        <span className="font-sans text-xl font-bold tracking-tight text-slate-800 group-hover:opacity-70 transition-opacity duration-200">
                            PureFind.
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
                    </nav>
                )}
            </header>

            {/* Spacer so page content starts below the floating nav */}
            <div className="h-24" />
        </>
    );
}
