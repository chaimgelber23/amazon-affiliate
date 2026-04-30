"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <header
                className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? "bg-white/85 backdrop-blur-xl border-b border-[var(--color-border)] shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                        : "bg-transparent border-b border-transparent"
                }`}
            >
                <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">

                    <Link href="/" className="font-display text-[19px] font-bold tracking-tight text-slate-900 hover:opacity-70 transition-opacity">
                        PureFind
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="/about"
                            className="text-[14px] font-medium text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] transition-colors"
                        >
                            About
                        </Link>
                        <Link
                            href="/extension"
                            className="inline-flex items-center gap-2 text-[14px] font-semibold text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-full transition-all shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="3.5" />
                                <path d="M12 2a10 10 0 0 1 8.66 5L12 12" />
                                <path d="M2.05 13a10 10 0 0 0 5.95 8.5L12 12" />
                                <path d="M21.95 13a10 10 0 0 1-9.95 9L12 12" />
                            </svg>
                            Get the Chrome extension
                        </Link>
                    </nav>

                    <button
                        className="md:hidden text-[13px] font-bold uppercase tracking-widest text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] transition-colors min-h-[44px] flex items-center"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? "Close" : "Menu"}
                    </button>
                </div>

                {mobileOpen && (
                    <nav className="md:hidden border-t border-[var(--color-border)] bg-white/95 backdrop-blur-xl px-5 py-4 space-y-1">
                        <Link
                            href="/about"
                            className="flex items-center text-[15px] font-medium text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] min-h-[44px]"
                            onClick={() => setMobileOpen(false)}
                        >
                            About
                        </Link>
                        <Link
                            href="/extension"
                            className="flex items-center gap-2 text-[15px] font-semibold text-slate-900 min-h-[44px]"
                            onClick={() => setMobileOpen(false)}
                        >
                            Get the Chrome extension
                        </Link>
                    </nav>
                )}
            </header>

            <div className="h-16" />
        </>
    );
}
