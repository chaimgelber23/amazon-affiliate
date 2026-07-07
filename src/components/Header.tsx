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
                        ? "bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)] shadow-[0_1px_0_rgba(26,15,8,0.04)]"
                        : "bg-transparent border-b border-transparent"
                }`}
            >
                <div className="px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">

                    <Link
                        href="/"
                        className="font-display text-[22px] font-bold tracking-[-0.03em] text-[var(--color-ink)] hover:opacity-70 transition-opacity"
                    >
                        ProductFindAI
                        <span className="text-[var(--color-rose)]">.</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="/#how-it-works"
                            className="text-[14px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                        >
                            How it works
                        </Link>
                        <Link
                            href="/about"
                            className="text-[14px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                        >
                            About
                        </Link>
                    </nav>

                    <button
                        className="md:hidden text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors min-h-[44px] flex items-center"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? "Close" : "Menu"}
                    </button>
                </div>

                {mobileOpen && (
                    <nav className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-xl px-5 py-4 space-y-1">
                        <Link
                            href="/#how-it-works"
                            className="flex items-center text-[15px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] min-h-[44px]"
                            onClick={() => setMobileOpen(false)}
                        >
                            How it works
                        </Link>
                        <Link
                            href="/about"
                            className="flex items-center text-[15px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] min-h-[44px]"
                            onClick={() => setMobileOpen(false)}
                        >
                            About
                        </Link>
                    </nav>
                )}
            </header>

            <div className="h-16" />
        </>
    );
}
