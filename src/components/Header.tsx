"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLockup } from "./BrandLockup";

export function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (!mobileOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMobileOpen(false);
                menuButtonRef.current?.focus();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [mobileOpen]);

    return (
        <>
            <a
                href="#main-content"
                className="sr-only fixed left-4 top-3 z-[60] rounded-xl bg-[var(--color-ink)] px-4 py-3 font-semibold text-white shadow-lg focus:not-sr-only"
            >
                Skip to main content
            </a>

            <header
                className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? "bg-[var(--color-bg)]/84 backdrop-blur-xl border-b border-[var(--color-border)] shadow-[0_1px_0_rgba(16,33,60,0.05)]"
                        : "bg-transparent border-b border-transparent"
                }`}
            >
                <div className="px-4 min-[380px]:px-5 sm:px-8 lg:px-12 h-[68px] flex items-center justify-between">

                    <Link
                        href="/"
                        aria-label="ProductFindAI home"
                        className="inline-flex min-h-11 items-center rounded-xl transition-opacity hover:opacity-80"
                    >
                        <BrandLockup />
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
                        ref={menuButtonRef}
                        className="md:hidden text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors min-h-[44px] flex items-center"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={mobileOpen}
                        aria-controls="mobile-navigation"
                    >
                        {mobileOpen ? "Close" : "Menu"}
                    </button>
                </div>

                {mobileOpen && (
                    <nav
                        id="mobile-navigation"
                        aria-label="Mobile navigation"
                        className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-xl px-5 py-4 space-y-1"
                    >
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

            <div className="h-[68px]" />
        </>
    );
}
