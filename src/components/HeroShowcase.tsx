"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { SearchBox } from "./SearchBox";

const SEARCH_PLACEHOLDERS = [
    "Ant traps under $25",
    "Standing desk under $300",
    "Subway-friendly stroller",
    "Headphones for glasses",
];

export function HeroShowcase() {
    const [searchActive, setSearchActive] = useState(false);
    const [activePlaceholder, setActivePlaceholder] = useState(0);
    const placeholder = SEARCH_PLACEHOLDERS[activePlaceholder];

    useEffect(() => {
        if (searchActive) return;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) return;

        const interval = window.setInterval(() => {
            setActivePlaceholder((current) => (current + 1) % SEARCH_PLACEHOLDERS.length);
        }, 4200);

        return () => window.clearInterval(interval);
    }, [searchActive]);

    return (
        <div className={`${searchActive ? "max-w-3xl" : "max-w-5xl"} mx-auto min-w-0`}>
            <div className="flex min-w-0 flex-col text-center">
                <h1 className="font-display order-1 mx-auto mb-5 max-w-4xl text-[34px] font-extrabold leading-[1.03] tracking-normal text-[var(--color-ink)] min-[380px]:text-[38px] sm:mb-7 sm:text-5xl lg:text-[68px]">
                    Start with what you need. Get an honest next step.
                </h1>

                <div className="order-2 mx-auto w-full max-w-3xl">
                    <SearchBox
                        onActiveChange={setSearchActive}
                        placeholder={placeholder}
                    />
                </div>

                <p className="order-3 mx-auto mt-6 max-w-2xl text-base leading-snug text-[var(--color-ink-muted)] sm:mt-7 sm:text-xl animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
                    When Amazon&apos;s official catalog is available, ProductFindAI checks current listing fields and builds a focused shortlist. If access is offline, your search stays intact and you can continue on Amazon.
                </p>

                <p className="order-4 mx-auto mt-4 max-w-xl text-[11px] leading-relaxed text-[var(--color-ink-dim)]">
                    As an Amazon Associate I earn from qualifying purchases.
                </p>

                {!searchActive && (
                    <div className="order-5">
                        <ul
                            className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-bold text-[var(--color-ink-dim)] animate-fade-in-up stagger-2"
                            style={{ opacity: 0 }}
                            aria-label="ProductFindAI trust points"
                        >
                            {["Official data when available", "Unconfirmed details stay labeled", "No paid placement"].map((point) => (
                                <li key={point} className="inline-flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-cart-orange)]" aria-hidden="true" />
                                    {point}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-5 hidden justify-center min-[380px]:flex animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
                            <Link
                                href="/privacy#amazon-affiliate-links"
                                className="text-[12px] text-[var(--color-ink-dim)] underline-offset-2 transition-colors hover:text-[var(--color-ink-muted)] hover:underline"
                            >
                                How affiliate links work
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {!searchActive && (
                <div className="mt-8 flex justify-center animate-fade-in stagger-4" style={{ opacity: 0 }}>
                    <a
                        href="#how-it-works"
                        className="inline-flex flex-col items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)] transition-colors hover:text-[var(--color-plum)]"
                    >
                        How it works
                        <ArrowDown size={15} strokeWidth={2.5} className="animate-bounce" aria-hidden="true" />
                    </a>
                </div>
            )}
        </div>
    );
}
