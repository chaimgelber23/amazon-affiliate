"use client";

import { useEffect } from "react";

/**
 * Force every fresh page load (or hard reload via F5/Ctrl+R) to start at the
 * very top of the page, instead of restoring the previous scroll position.
 *
 * Browsers default to `scrollRestoration = "auto"`, which preserves scroll on
 * reload. That UX bites for a search-result page: a visitor scrolls deep into
 * picks, hits reload, and lands mid-page on a now-stale view. Setting it to
 * "manual" plus an explicit scrollTo(0, 0) makes reload deterministic.
 *
 * The empty-deps useEffect fires once per app mount — i.e. on initial load
 * and on hard reload — but NOT on Next.js client-side navigation. Next's
 * own router-driven scroll behavior is preserved.
 */
export function ScrollToTopOnLoad() {
    useEffect(() => {
        if (typeof window === "undefined") return;
        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }
        window.scrollTo(0, 0);
    }, []);
    return null;
}
