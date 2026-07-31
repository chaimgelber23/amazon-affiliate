"use client";

import { useState, useMemo, useEffect, useId, useRef } from "react";
import { buildAffiliateUrl, buildAffiliateSearchUrl } from "@/lib/affiliate";
import {
    orderProductBadges,
    PRODUCT_BADGE_TONE_CLASSES,
    type ProductBadge,
} from "@/lib/product-badges";
import {
    combineSearchIntent,
    extractRequestedAsins,
} from "@/lib/search-core";
import { CompareTable } from "./CompareTable";

interface Product {
    rank: number;
    title: string;
    asin: string;
    whyThisPick: string;
    pros: string[];
    cons: string[];
    priceEstimate: string;
    rating: number;
    category: string;
    imageUrl?: string;
    amazonUrl?: string;
    fetchedAt?: string;
    reviewCount?: number;
    verified?: boolean;
    badges?: ProductBadge[];
    tier?: "budget" | "mid" | "premium";
    confidence?: "high" | "medium" | "low";
    constraintEvidence?: Array<{
        claim: string;
        verdict: "PASS" | "FAIL" | "UNKNOWN";
        blocks: boolean;
    }>;
    unknownConstraints?: string[];
}

interface SearchResult {
    summary: string;
    products: Product[];
    enriched?: boolean;
    fetchedAt?: string;
    mode?: "ai-ranked" | "amazon-direct";
    meta?: {
        requestMode?: "fresh" | "refinement" | "exact-item";
    };
}

const DEFAULT_VISIBLE_RESULT_COUNT = 8;

function extractAsinFromText(text: string): string | null {
    return extractRequestedAsins(text)[0] ?? null;
}

function isExactAmazonItemQuery(text: string): boolean {
    return extractAsinFromText(text) !== null;
}

function ProductBadgePills({
    badges,
    className = "",
}: {
    badges?: readonly ProductBadge[];
    className?: string;
}) {
    const orderedBadges = orderProductBadges(badges);
    if (orderedBadges.length === 0) return null;

    return (
        <div
            role="list"
            aria-label="Shortlist badges"
            className={`flex flex-wrap items-start gap-2 ${className}`}
        >
            {orderedBadges.map((badge) => (
                <div
                    key={badge.kind}
                    role="listitem"
                    className="max-w-full"
                >
                    <details className="group max-w-full">
                        <summary
                            onKeyDown={(event) => {
                                if (event.key !== "Enter" && event.key !== " ") return;
                                event.preventDefault();
                                const details = event.currentTarget.closest(
                                    "details",
                                ) as HTMLDetailsElement | null;
                                if (details) details.open = !details.open;
                            }}
                            className={`inline-flex min-h-8 max-w-full cursor-pointer list-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold leading-none shadow-[0_1px_2px_rgba(16,33,60,0.05)] outline-none transition-[filter,box-shadow] hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--color-plum)] focus-visible:ring-offset-2 group-open:shadow-sm [&::-webkit-details-marker]:hidden ${PRODUCT_BADGE_TONE_CLASSES[badge.kind]}`}
                        >
                            <span
                                className="h-1.5 w-1.5 flex-none rounded-full bg-current opacity-60"
                                aria-hidden="true"
                            />
                            <span>{badge.label}</span>
                            <svg
                                viewBox="0 0 12 12"
                                className="h-3 w-3 flex-none transition-transform group-open:rotate-180"
                                aria-hidden="true"
                            >
                                <path
                                    d="m2.25 4.25 3.75 3.5 3.75-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                />
                            </svg>
                            <span className="sr-only"> — why it was awarded</span>
                        </summary>
                        <div
                            role="note"
                            aria-label={`Why ${badge.label} was awarded`}
                            className="mt-2 max-w-[19rem] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-solid)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--color-ink-muted)] shadow-sm"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-plum)]">
                                Why {badge.label}
                            </p>
                            <p className="mt-1 font-medium">{badge.evidence}</p>
                        </div>
                    </details>
                </div>
            ))}
        </div>
    );
}

function ProsConsSummary({ product }: { product: Product }) {
    const remainingPros = product.pros.slice(1);
    const remainingCons = product.cons.slice(1);
    const hasMore = remainingPros.length > 0 || remainingCons.length > 0;

    return (
        <section
            className="mt-5"
            aria-label={`Pros and cons for ${product.title}`}
        >
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                        Top pro
                    </p>
                    <p className="mt-2 break-words text-sm leading-relaxed text-[var(--color-surface-muted)]">
                        {product.pros[0] ??
                            "The official listing did not state a supported advantage."}
                    </p>
                </div>
                <div className="min-w-0 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-rose-deep)]">
                        Main con
                    </p>
                    <p className="mt-2 break-words text-sm leading-relaxed text-[var(--color-surface-muted)]">
                        {product.cons[0] ??
                            "The official listing did not state a supported drawback."}
                    </p>
                </div>
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-ink-dim)]">
                Based on official Amazon listing fields, not hands-on testing.
            </p>

            {hasMore && (
                <details className="group mt-3">
                    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card-solid)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink-muted)] outline-none transition-colors hover:border-[var(--color-plum)] hover:text-[var(--color-plum)] focus-visible:ring-2 focus-visible:ring-[var(--color-plum)] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">
                            Show all pros &amp; cons
                        </span>
                        <span className="hidden group-open:inline">
                            Hide additional pros &amp; cons
                        </span>
                        <svg
                            viewBox="0 0 12 12"
                            className="h-3.5 w-3.5 flex-none transition-transform group-open:rotate-180"
                            aria-hidden="true"
                        >
                            <path
                                d="m2.25 4.25 3.75 3.5 3.75-3.5"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                            />
                        </svg>
                    </summary>

                    <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                        {remainingPros.length > 0 && (
                            <div className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                    More pros
                                </p>
                                <ul className="mt-3 space-y-2.5">
                                    {remainingPros.map((pro, index) => (
                                        <li
                                            key={`${pro}-${index}`}
                                            className="flex min-w-0 items-start gap-2 text-sm leading-relaxed text-[var(--color-surface-muted)]"
                                        >
                                            <span
                                                className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500"
                                                aria-hidden="true"
                                            />
                                            <span className="min-w-0 break-words">
                                                {pro}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {remainingCons.length > 0 && (
                            <div className="min-w-0 rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-rose-deep)]">
                                    More cons
                                </p>
                                <ul className="mt-3 space-y-2.5">
                                    {remainingCons.map((con, index) => (
                                        <li
                                            key={`${con}-${index}`}
                                            className="flex min-w-0 items-start gap-2 text-sm leading-relaxed text-[var(--color-surface-muted)]"
                                        >
                                            <span
                                                className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[var(--color-rose)]"
                                                aria-hidden="true"
                                            />
                                            <span className="min-w-0 break-words">
                                                {con}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </details>
            )}
        </section>
    );
}

function ProductImage({ product }: { product: Product }) {
    const [errored, setErrored] = useState(false);

    if (product.imageUrl && !errored) {
        return (
            // eslint-disable-next-line @next/next/no-img-element -- remote Amazon product image with onError fallback; next/image would need per-domain config and change loading behavior
            <img
                src={product.imageUrl}
                alt={product.title}
                width={144}
                height={144}
                className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-2xl object-contain bg-white border border-[var(--color-border)] p-2 shadow-sm"
                onError={() => setErrored(true)}
                loading="lazy"
            />
        );
    }

    return (
        <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-surface-dim)]">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
            </svg>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="product-card p-6 sm:p-7 shimmer-bg">
            <div className="flex gap-5 sm:gap-7">
                <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-2xl bg-[var(--color-bg-warm)]" />
                <div className="flex-1 space-y-4 py-2">
                    <div className="h-4 bg-[var(--color-bg-warm)] rounded-full w-1/4" />
                    <div className="h-6 bg-[var(--color-bg-warm)] rounded-full w-3/4" />
                    <div className="h-5 bg-[var(--color-bg-warm)] rounded-full w-1/3 mt-2" />
                    <div className="h-px bg-[var(--color-border)] mt-5 mb-2" />
                    <div className="h-4 bg-[var(--color-bg-warm)] rounded-full w-full" />
                    <div className="h-4 bg-[var(--color-bg-warm)] rounded-full w-5/6" />
                </div>
            </div>
        </div>
    );
}

function StarRating({ rating, reviewCount, verified }: { rating: number; reviewCount?: number; verified?: boolean }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.3;
    const accessibleLabel = verified
        ? `Rated ${rating.toFixed(1)} out of 5${
            reviewCount ? ` from ${reviewCount.toLocaleString()} reviews` : ""
        }`
        : `Estimated rating ${rating.toFixed(1)} out of 5; confirm on Amazon`;
    return (
        <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-surface-dim)]"
            title={verified ? "Live Amazon rating" : "Confirm rating on Amazon"}
            aria-label={accessibleLabel}
        >
            <span className="inline-flex gap-px">
                {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < full ? "text-amber-500" : i === full && half ? "text-amber-300" : "text-[var(--color-bg-elevated)]"} aria-hidden="true">
                        ★
                    </span>
                ))}
            </span>
            <span className="font-mono tnum">{rating.toFixed(1)}</span>
            {verified && reviewCount ? (
                <span className="text-xs font-mono tnum text-[var(--color-surface-dim)]">
                    ({reviewCount.toLocaleString()})
                </span>
            ) : !verified ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-surface-dim)] opacity-70">
                    est.
                </span>
            ) : null}
        </span>
    );
}

function formatSearchTime(iso?: string): string {
    if (!iso) return "search time";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "search time";
    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });
}

// One bounded request keeps the visible "up to 60 seconds" promise honest.
// Retrying a full server deadline automatically could leave someone waiting
// several minutes; a clear error lets them decide when to try again.
interface CatalogFallback {
    kind: "product" | "search";
    amazonUrl?: string;
    asin?: string;
    query?: string;
}

type SearchFailure = {
    ok: false;
    error: string;
    code?: string;
    fallback?: CatalogFallback;
    status?: number;
    retryAfterSeconds?: number;
};

interface CatalogBlockedState {
    attemptedIntent: string;
    amazonUrl: string;
    wasRefinement: boolean;
}

interface NoMatchState extends CatalogBlockedState {
    message: string;
    exactItem: boolean;
}

function safeAmazonUrl(value: string | undefined): string | null {
    if (!value) return null;
    try {
        const parsed = new URL(value);
        if (
            parsed.protocol === "https:" &&
            (
                parsed.hostname === "amazon.com" ||
                parsed.hostname.endsWith(".amazon.com")
            )
        ) {
            return parsed.toString();
        }
    } catch {
        // Use the locally constructed tagged fallback below.
    }
    return null;
}

async function postSearch(
    payload: unknown,
    attempts = 1,
    externalSignal?: AbortSignal,
): Promise<{ ok: true; data: SearchResult } | SearchFailure> {
    for (let i = 0; i < attempts; i++) {
        try {
            const timeoutSignal = AbortSignal.timeout(62_000);
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: externalSignal
                    ? AbortSignal.any([externalSignal, timeoutSignal])
                    : timeoutSignal,
            });
            if (res.ok) return { ok: true, data: (await res.json()) as SearchResult };
            if (res.status >= 500 && i < attempts - 1) {
                await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
                continue;
            }
            const errData = await res.json().catch(() => ({})) as {
                error?: unknown;
                code?: unknown;
                fallback?: unknown;
            };
            const fallback =
                errData.fallback &&
                typeof errData.fallback === "object"
                    ? errData.fallback as CatalogFallback
                    : undefined;
            return {
                ok: false,
                error:
                    typeof errData.error === "string"
                        ? errData.error
                        : "Search failed. Please try again.",
                code:
                    typeof errData.code === "string"
                        ? errData.code
                        : undefined,
                fallback,
                status: res.status,
                retryAfterSeconds: (() => {
                    const seconds = Number(res.headers.get("Retry-After"));
                    return Number.isFinite(seconds) && seconds > 0
                        ? Math.ceil(seconds)
                        : undefined;
                })(),
            };
        } catch (error) {
            if (externalSignal?.aborted) {
                return {
                    ok: false,
                    error: "Search canceled. Your request is still in the search box.",
                    code: "SEARCH_CANCELLED",
                };
            }
            if (
                error instanceof DOMException &&
                (error.name === "TimeoutError" || error.name === "AbortError")
            ) {
                return {
                    ok: false,
                    error:
                        "This search took longer than 60 seconds. Try a more specific request or try again.",
                };
            }
            if (i < attempts - 1) {
                await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
                continue;
            }
            return { ok: false, error: "Something went wrong. Please try again." };
        }
    }
    return { ok: false, error: "The search engine is busy right now. Please try again in a moment." };
}

export function SearchBox({
    onActiveChange,
    placeholder = `Try "standing desk under $300"`,
}: {
    onActiveChange?: (active: boolean) => void;
    placeholder?: string;
} = {}) {
    const [query, setQuery] = useState("");
    const [originalQuery, setOriginalQuery] = useState<string | null>(null);
    const [refinementChain, setRefinementChain] = useState<string[]>([]);
    const [detectedAsin, setDetectedAsin] = useState<string | null>(null);
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [catalogBlocked, setCatalogBlocked] =
        useState<CatalogBlockedState | null>(null);
    const [noMatch, setNoMatch] = useState<NoMatchState | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [compareSet, setCompareSet] = useState<Set<number>>(new Set());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [loadingMode, setLoadingMode] = useState<
        "fresh" | "refinement" | "exact-item"
    >("fresh");
    const [activeSearchIntent, setActiveSearchIntent] = useState("");
    const searchInputId = useId();
    const searchHelpId = `${searchInputId}-help`;
    const isExactItemResult =
        results?.meta?.requestMode === "exact-item" ||
        results?.mode === "amazon-direct";
    const searchRegionRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const resultSummaryRef = useRef<HTMLDivElement>(null);
    const comparisonRef = useRef<HTMLDivElement>(null);
    const catalogBlockedRef = useRef<HTMLElement>(null);
    const noMatchRef = useRef<HTMLElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);
    const activeRequestRef = useRef<AbortController | null>(null);
    const previousCompareCountRef = useRef(0);
    const wasActiveRef = useRef(false);

    // Let the hero know when a search owns the viewport (loading or results
    // showing) so it can tuck away the demo shortlist and proof chips.
    useEffect(() => {
        const active =
            loading ||
            !!results ||
            !!catalogBlocked ||
            !!noMatch ||
            !!error;
        onActiveChange?.(active);

        if (active && !wasActiveRef.current) {
            const frame = window.requestAnimationFrame(() => {
                const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                searchRegionRef.current?.scrollIntoView({
                    block: "start",
                    behavior: reducedMotion ? "auto" : "smooth",
                });
            });
            wasActiveRef.current = active;
            return () => window.cancelAnimationFrame(frame);
        }

        wasActiveRef.current = active;
    }, [loading, results, catalogBlocked, noMatch, error, onActiveChange]);

    useEffect(() => {
        if (loading || !results) return;

        const frame = window.requestAnimationFrame(() => {
            resultSummaryRef.current?.focus({ preventScroll: true });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [loading, results]);

    useEffect(() => {
        if (loading) return;
        const target = catalogBlocked
            ? catalogBlockedRef.current
            : noMatch
              ? noMatchRef.current
              : error
                ? errorRef.current
                : null;
        if (!target) return;
        const frame = window.requestAnimationFrame(() => {
            target.focus({ preventScroll: true });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [loading, catalogBlocked, noMatch, error]);

    useEffect(
        () => () => {
            activeRequestRef.current?.abort();
        },
        [],
    );

    useEffect(() => {
        if (!loading) return;

        const startedAt = Date.now();
        const timer = window.setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [loading]);

    const toggleCompare = (rank: number) => {
        setCompareSet((prev) => {
            const next = new Set(prev);
            if (next.has(rank)) next.delete(rank);
            else if (next.size < 3) next.add(rank);
            return next;
        });
    };

    const compareProducts = useMemo(() => {
        if (!results) return [];
        return results.products.filter((p) => compareSet.has(p.rank));
    }, [results, compareSet]);

    useEffect(() => {
        const previousCount = previousCompareCountRef.current;
        previousCompareCountRef.current = compareProducts.length;
        if (compareProducts.length < 2 || previousCount >= 2) return;

        const frame = window.requestAnimationFrame(() => {
            comparisonRef.current?.scrollIntoView({
                block: "start",
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? "auto"
                    : "smooth",
            });
            comparisonRef.current?.focus({ preventScroll: true });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [compareProducts.length]);

    const handleQueryChange = (val: string) => {
        setQuery(val);
        if (isExactAmazonItemQuery(val)) {
            setDetectedAsin(extractAsinFromText(val));
        } else {
            setDetectedAsin(null);
        }
    };

    const resetSearch = () => {
        activeRequestRef.current?.abort();
        activeRequestRef.current = null;
        setResults(null);
        setQuery("");
        setOriginalQuery(null);
        setRefinementChain([]);
        setDetectedAsin(null);
        setCompareSet(new Set());
        setShowAll(false);
        setError(null);
        setCatalogBlocked(null);
        setNoMatch(null);
        setLoading(false);
        setActiveSearchIntent("");
    };

    const doSearch = async (q: string, isRefinement = false) => {
        if (!q.trim()) return;
        const effectiveRefinement = Boolean(isRefinement && results);
        const asin = extractAsinFromText(q);
        const isExactItem = Boolean(asin && isExactAmazonItemQuery(q));
        const isExactLookup = isExactItem && !effectiveRefinement;
        const priorIntent = combineSearchIntent([
            originalQuery,
            ...refinementChain,
        ]);
        const attemptedIntent = effectiveRefinement
            ? combineSearchIntent([priorIntent, q])
            : q.trim();
        setError(null);
        setCatalogBlocked(null);
        setNoMatch(null);

        if (!effectiveRefinement) {
            setResults(null);
        }

        setElapsedSeconds(0);
        setLoadingMode(
            isExactLookup
                ? "exact-item"
                : effectiveRefinement
                  ? "refinement"
                  : "fresh",
        );
        setActiveSearchIntent(attemptedIntent);
        setLoading(true);
        activeRequestRef.current?.abort();
        const requestController = new AbortController();
        activeRequestRef.current = requestController;

        // Build the refinement payload — server sees `priorProducts` and treats
        // the new query as a narrowing constraint, not a fresh search.
        const body = effectiveRefinement && results
            ? {
                messages: [{ role: "user", content: q }],
                originalQuery: priorIntent,
                priorProducts: results.products.map((p) => ({
                    asin: p.asin,
                    rank: p.rank,
                    title: p.title,
                    category: p.category,
                })),
            }
            : {
                messages: [{ role: "user", content: q }],
            };

        const result = await postSearch(body, 1, requestController.signal);
        if (activeRequestRef.current !== requestController) return;
        activeRequestRef.current = null;
        if (result.ok) {
            const data = result.data;
            setResults(data);
            setCatalogBlocked(null);
            setShowAll(false);
            setCompareSet(new Set());
            setDetectedAsin(null);
            if (effectiveRefinement) {
                setRefinementChain((chain) => [...chain, q]);
            } else {
                setOriginalQuery(q);
                setRefinementChain([]);
            }
            setQuery("");
        } else {
            if (result.code === "AMAZON_ACCESS_UNAVAILABLE") {
                const serverFallback = safeAmazonUrl(
                    result.fallback?.amazonUrl,
                );
                const fallbackUrl =
                    effectiveRefinement
                        ? buildAffiliateSearchUrl(attemptedIntent)
                        : serverFallback ??
                          (
                              asin
                                  ? buildAffiliateUrl(asin)
                                  : buildAffiliateSearchUrl(attemptedIntent)
                          );
                setCatalogBlocked({
                    attemptedIntent,
                    amazonUrl: fallbackUrl,
                    wasRefinement: effectiveRefinement,
                });
                setNoMatch(null);
                setError(null);
                if (!effectiveRefinement) {
                    setResults(null);
                }
            } else if (
                result.code === "NO_VERIFIED_MATCH" ||
                result.code === "NO_REFINEMENT_MATCH" ||
                result.code === "EXACT_ITEM_NOT_VERIFIED"
            ) {
                const serverFallback = safeAmazonUrl(
                    result.fallback?.amazonUrl,
                );
                setNoMatch({
                    attemptedIntent,
                    amazonUrl:
                        serverFallback ??
                        (
                            asin && isExactLookup
                                ? buildAffiliateUrl(asin)
                                : buildAffiliateSearchUrl(attemptedIntent)
                        ),
                    wasRefinement: effectiveRefinement,
                    exactItem: result.code === "EXACT_ITEM_NOT_VERIFIED",
                    message: result.error,
                });
                setCatalogBlocked(null);
                setError(null);
                if (!effectiveRefinement) {
                    setResults(null);
                }
            } else if (result.code !== "SEARCH_CANCELLED") {
                const retryCopy = result.retryAfterSeconds
                    ? ` Try again in about ${result.retryAfterSeconds} second${
                        result.retryAfterSeconds === 1 ? "" : "s"
                    }.`
                    : "";
                setError(`${result.error}${retryCopy}`);
            }
        }
        setLoading(false);
    };

    const cancelSearch = () => {
        const request = activeRequestRef.current;
        if (!request) return;
        activeRequestRef.current = null;
        request.abort();
        setLoading(false);
        setError("Search canceled. Your request is still in the search box.");
        window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
        });
    };

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        doSearch(query, inRefinementMode);
    };

    const inRefinementMode = !!results && !isExactItemResult;
    const refinementCount = results?.products.length ?? 0;
    const activeExactAsin =
        loadingMode === "exact-item"
            ? extractAsinFromText(activeSearchIntent)
            : null;
    const activeAmazonUrl = activeExactAsin
        ? buildAffiliateUrl(activeExactAsin)
        : buildAffiliateSearchUrl(activeSearchIntent || query);
    const detectedAsinIsPriorResult = Boolean(
        detectedAsin &&
            results?.products.some(
                (product) => product.asin.toUpperCase() === detectedAsin,
            ),
    );
    const canCompare = (results?.products.length ?? 0) >= 2;

    const focusCompareButton = (rank: number | undefined) => {
        if (rank === undefined) return;
        window.requestAnimationFrame(() => {
            document.getElementById(`compare-product-${rank}`)?.focus();
        });
    };

    const closeComparison = () => {
        const returnRank = compareProducts[0]?.rank;
        setCompareSet(new Set());
        focusCompareButton(returnRank);
    };

    const removeFromComparison = (rank: number) => {
        toggleCompare(rank);
        focusCompareButton(rank);
    };

    const amazonHref = (p: Product) => {
        if (p.amazonUrl) {
            try {
                const officialUrl = new URL(p.amazonUrl);
                if (
                    officialUrl.protocol === "https:" &&
                    (
                        officialUrl.hostname === "amazon.com" ||
                        officialUrl.hostname.endsWith(".amazon.com")
                    )
                ) {
                    return p.amazonUrl;
                }
            } catch {
                // Fall through to a locally constructed Associates link.
            }
        }
        const cleanAsin = typeof p.asin === "string" ? p.asin.trim() : "";
        if (!cleanAsin || cleanAsin === "SEARCH") {
            return buildAffiliateSearchUrl(p.title);
        }
        return buildAffiliateUrl(cleanAsin);
    };

    return (
        <div
            ref={searchRegionRef}
            className="w-full max-w-3xl mx-auto relative z-20 scroll-mt-24 text-left"
            aria-busy={loading}
        >

            {/* ── REFINEMENT BREADCRUMB CHAIN ── */}
            {inRefinementMode && !loading && (originalQuery || refinementChain.length > 0) && (
                <div className="mb-4 flex items-center gap-2 flex-wrap text-xs font-medium text-[var(--color-ink-muted)] animate-fade-in">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-plum)]">
                        {isExactItemResult ? "Current result" : "Current shortlist"}: {refinementCount} {isExactItemResult
                            ? (refinementCount === 1 ? "result" : "results")
                            : (refinementCount === 1 ? "pick" : "picks")}
                    </span>
                    {originalQuery && (
                        <>
                            <span className="text-[var(--color-ink-dim)]">·</span>
                            <span className="px-2.5 py-0.5 bg-[var(--color-bg-warm)] border border-[var(--color-border)] rounded-full">
                                {originalQuery.length > 40 ? originalQuery.slice(0, 40) + "…" : originalQuery}
                            </span>
                        </>
                    )}
                    {refinementChain.map((step, i) => (
                        <span key={i} className="flex items-center gap-2">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--color-rose)]">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                            <span className="px-2.5 py-0.5 bg-[var(--color-accent-muted)] border border-[var(--color-border)] rounded-full text-[var(--color-plum)]">
                                {step.length > 32 ? step.slice(0, 32) + "…" : step}
                            </span>
                        </span>
                    ))}
                </div>
            )}

            {/* ── SEARCH BAR ── */}
            <div className="mb-2.5 flex items-end justify-between gap-3 px-1">
                <label htmlFor={searchInputId} className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-plum)]">
                        {inRefinementMode
                            ? "Refine these picks"
                            : isExactItemResult
                              ? "Search again"
                              : "Start here"}
                    </span>
                    <span className="mt-1 block text-sm font-bold leading-tight text-[var(--color-ink)] sm:text-base">
                        {inRefinementMode
                            ? "What should these picks also have?"
                            : isExactItemResult
                              ? "What product should we look up next?"
                              : "What are you shopping for?"}
                    </span>
                </label>
                {!inRefinementMode && !results && (
                    <span className="hidden flex-shrink-0 text-[11px] font-semibold text-[var(--color-ink-dim)] min-[360px]:block">
                        Plain English works
                    </span>
                )}
            </div>
            <form onSubmit={handleSubmit} className="relative group">
                {/* Soft glowing aura — picks up the brand gradient on focus, not the indigo→purple AI-tell */}
                <div className="absolute -inset-1 bg-[var(--color-accent-gradient)] rounded-[30px] opacity-10 group-focus-within:opacity-30 blur-2xl transition duration-500 group-focus-within:duration-200" />

                <div className={`relative flex bg-[var(--color-bg-card-solid)] backdrop-blur-xl rounded-[26px] overflow-hidden transition-all shadow-[0_18px_48px_-22px_rgba(0,34,100,0.40),0_6px_18px_-12px_rgba(16,33,60,0.24)] ${
                    inRefinementMode ? "items-center" : "flex-col items-stretch sm:flex-row sm:items-center"
                } ${
                    inRefinementMode
                        ? "border-2 border-[var(--color-plum)]/30"
                        : "border-2 border-[var(--color-plum)]/25"
                }`}>
                    <div className="flex min-w-0 w-full items-center">
                        <span
                            className={`ml-4 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-muted)] text-[var(--color-plum)] sm:ml-5 ${
                                inRefinementMode ? "hidden sm:inline-flex" : "inline-flex"
                            }`}
                            aria-hidden="true"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="21" y1="21" x2="16.5" y2="16.5" />
                            </svg>
                        </span>
                        <input
                            ref={searchInputRef}
                            id={searchInputId}
                            className="min-w-0 w-full bg-transparent py-4 pl-3 pr-5 text-base font-medium text-[var(--color-ink)] placeholder-[var(--color-ink-dim)] focus:outline-none sm:py-6 sm:pl-3 sm:pr-7 sm:text-xl"
                            placeholder={inRefinementMode
                                ? `Add a detail: "under $100", "wireless", "small office"`
                                : isExactItemResult
                                  ? "Paste another Amazon link or describe a product"
                                  : placeholder}
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            onKeyDown={(event) => {
                                if (
                                    event.key !== "Enter" ||
                                    loading ||
                                    !query.trim()
                                ) {
                                    return;
                                }
                                event.preventDefault();
                                void doSearch(query, inRefinementMode);
                            }}
                            disabled={loading}
                            autoComplete="off"
                            aria-describedby={!inRefinementMode && !results ? searchHelpId : undefined}
                        />
                        {detectedAsin && (
                            <span className="mx-3 hidden flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--color-plum)]/20 bg-[var(--color-accent-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-plum)] sm:flex">
                                {inRefinementMode
                                    ? detectedAsinIsPriorResult
                                        ? "From this shortlist"
                                        : "Exact item filter"
                                    : "Exact Amazon product"}
                            </span>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className={`btn-primary py-3 px-4 sm:py-3.5 sm:px-8 text-sm sm:text-base disabled:opacity-80 disabled:cursor-not-allowed whitespace-nowrap ${
                            inRefinementMode
                                ? "mx-2 sm:mx-3 px-4 sm:px-8"
                                : "mx-3 mb-3 w-[calc(100%-1.5rem)] sm:mx-3 sm:mb-0 sm:w-auto"
                        }`}
                    >
                        {loading ? "Searching…" : inRefinementMode ? (
                            <>
                                <span className="sm:hidden">Update</span>
                                <span className="hidden sm:inline">Update picks</span>
                            </>
                        ) : detectedAsin ? "Look up product" : isExactItemResult ? "Search again" : "Research it for me"}
                    </button>
                </div>
                {!inRefinementMode && !results && (
                    <p
                        id={searchHelpId}
                        className="mt-2.5 px-1 text-[11px] font-semibold leading-relaxed text-[var(--color-ink-dim)]"
                    >
                        Tip: include the product type, budget, and priorities.
                    </p>
                )}
                {inRefinementMode && !loading && (
                    <p className="text-xs font-medium text-[var(--color-ink-dim)] mt-3 pl-1 leading-relaxed">
                        Add a detail to recheck only the products in this shortlist. ProductFindAI keeps listings that do not conflict with the new detail and labels anything the official fields do not confirm.{" "}
                        <button
                            type="button"
                            onClick={resetSearch}
                            className="text-[var(--color-plum)] hover:text-[var(--color-rose)] hover:underline transition-colors font-semibold"
                        >
                            Start fresh anytime.
                        </button>
                    </p>
                )}
            </form>

            {/* ── LOADING SKELETONS ── */}
            {loading && (
                <div className="mt-12 space-y-6 animate-fade-in">
                    <div
                        data-testid="search-loading"
                        className="glass rounded-3xl p-5 sm:p-6"
                        role="status"
                        aria-live="polite"
                        aria-atomic="false"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="font-display text-xl font-bold text-[var(--color-ink)]">
                                    {loadingMode === "exact-item"
                                        ? "Checking the exact listing"
                                        : loadingMode === "refinement"
                                          ? "Rechecking your shortlist"
                                          : "Building your shortlist"}
                                </p>
                                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                                    Most searches take 20 to 60 seconds. Keep this tab open.
                                </p>
                            </div>
                            <span
                                className="font-mono tnum self-start rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-card-solid)] px-3 py-1.5 text-xs font-semibold text-[var(--color-plum)]"
                                aria-hidden="true"
                            >
                                Elapsed {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
                            </span>
                        </div>
                        <div
                            className="search-progress-track mt-5"
                            aria-hidden="true"
                        >
                            <span className="search-progress-bar" />
                        </div>
                        <p className="mt-4 text-xs font-medium leading-relaxed text-[var(--color-ink-dim)]">
                            {elapsedSeconds >= 45
                                ? "Still working. Detailed searches can use the full minute."
                                : loadingMode === "exact-item"
                                  ? "Amazon's official product service is verifying the requested ASIN. No substitute listing will be added."
                                  : loadingMode === "refinement"
                                    ? "ProductFindAI is re-fetching only the products already in your shortlist. Unsupported details will stay labeled as unconfirmed."
                                    : "ProductFindAI is checking up to 30 official Amazon listings and ranking up to 8 evidence-backed matches. Unsupported details will stay labeled as unconfirmed."}
                        </p>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={cancelSearch}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--color-plum)] hover:text-[var(--color-plum)]"
                            >
                                Cancel search
                            </button>
                            <a
                                href={activeAmazonUrl}
                                target="_blank"
                                rel="noopener noreferrer nofollow sponsored"
                                className="inline-flex min-h-11 items-center justify-center px-3 py-2.5 text-sm font-semibold text-[var(--color-plum)] hover:underline"
                            >
                                Continue on Amazon while you wait
                            </a>
                        </div>
                        <p className="mt-2 text-[10px] leading-relaxed text-[var(--color-ink-dim)]">
                            Amazon link is an affiliate link. ProductFindAI has
                            not checked, ranked, or endorsed those search
                            results.
                        </p>
                    </div>
                    <div className="space-y-6" aria-hidden="true">
                        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </div>
            )}

            {/* ── ERROR ── */}
            {/* Catalog access is a distinct product state, not a fake result. */}
            {catalogBlocked && !loading && (
                <section
                    ref={catalogBlockedRef}
                    tabIndex={-1}
                    data-testid="catalog-unavailable"
                    className="mt-8 rounded-3xl border border-amber-300 bg-amber-50/90 p-6 text-left shadow-sm sm:p-7"
                    role="alert"
                    aria-labelledby={`${searchInputId}-catalog-unavailable-title`}
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-800">
                        Official catalog unavailable
                    </p>
                    <h2
                        id={`${searchInputId}-catalog-unavailable-title`}
                        className="mt-2 font-display text-xl font-bold text-[var(--color-surface)]"
                    >
                        We couldn&apos;t verify products for this search.
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--color-surface-muted)]">
                        ProductFindAI cannot access Amazon&apos;s official product
                        catalog right now, so we did not rank or recommend any
                        products for this attempt.
                    </p>
                    <p className="mt-3 break-words rounded-2xl border border-amber-200 bg-white/70 px-4 py-3 text-sm text-[var(--color-surface-muted)]">
                        <span className="font-bold text-[var(--color-surface)]">
                            Your search:
                        </span>{" "}
                        &ldquo;{catalogBlocked.attemptedIntent}&rdquo;
                    </p>
                    {catalogBlocked.wasRefinement && (
                        <p className="mt-3 text-sm font-semibold text-amber-900">
                            This refinement was not applied; your current
                            shortlist is unchanged.
                        </p>
                    )}
                    <div className="mt-5">
                        <a
                            href={catalogBlocked.amazonUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow sponsored"
                            className="btn-amazon inline-flex min-h-11 items-center justify-center px-6 py-3 text-sm"
                        >
                            Continue this search on Amazon
                        </a>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                void doSearch(query, catalogBlocked.wasRefinement)
                            }
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-950 hover:border-amber-500"
                        >
                            Try catalog again
                        </button>
                        <button
                            type="button"
                            onClick={() => searchInputRef.current?.focus()}
                            className="inline-flex min-h-11 items-center justify-center px-3 py-2.5 text-sm font-semibold text-[var(--color-plum)] hover:underline"
                        >
                            Edit search
                        </button>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-ink-dim)]">
                        Affiliate link. As an Amazon Associate I earn from
                        qualifying purchases. ProductFindAI has not verified,
                        ranked, or endorsed the Amazon results.
                    </p>
                </section>
            )}

            {noMatch && !loading && (
                <section
                    ref={noMatchRef}
                    tabIndex={-1}
                    data-testid="no-verified-match"
                    className="mt-8 rounded-3xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card-solid)] p-6 text-left shadow-sm sm:p-7"
                    role="alert"
                    aria-labelledby={`${searchInputId}-no-match-title`}
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-plum)]">
                        No evidence-backed match
                    </p>
                    <h2
                        id={`${searchInputId}-no-match-title`}
                        className="mt-2 font-display text-xl font-bold text-[var(--color-surface)]"
                    >
                        {noMatch.exactItem
                            ? "We couldn't verify that exact listing."
                            : "Try changing one requirement."}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--color-surface-muted)]">
                        {noMatch.message}
                    </p>
                    <p className="mt-3 break-words rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] px-4 py-3 text-sm text-[var(--color-surface-muted)]">
                        <span className="font-bold text-[var(--color-surface)]">
                            Your search:
                        </span>{" "}
                        &ldquo;{noMatch.attemptedIntent}&rdquo;
                    </p>
                    {noMatch.wasRefinement && (
                        <p className="mt-3 text-sm font-semibold text-[var(--color-surface)]">
                            This refinement was not applied; your current
                            shortlist is unchanged.
                        </p>
                    )}
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <button
                            type="button"
                            onClick={() => searchInputRef.current?.focus()}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--color-plum)]"
                        >
                            Edit search
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                void doSearch(query, noMatch.wasRefinement)
                            }
                            className="inline-flex min-h-11 items-center justify-center px-4 py-2.5 text-sm font-semibold text-[var(--color-plum)] hover:underline"
                        >
                            Try again
                        </button>
                        <a
                            href={noMatch.amazonUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow sponsored"
                            className="btn-amazon inline-flex min-h-11 items-center justify-center px-6 py-3 text-sm"
                        >
                            {noMatch.exactItem
                                ? "Open this item on Amazon"
                                : "Continue on Amazon"}
                        </a>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-ink-dim)]">
                        Affiliate link. ProductFindAI has not verified, ranked,
                        or endorsed the Amazon results opened from this fallback.
                    </p>
                </section>
            )}

            {error && !loading && (
                <div
                    ref={errorRef}
                    tabIndex={-1}
                    data-testid="search-error"
                    className="mt-8 p-6 bg-red-50/80 backdrop-blur-md border border-red-200 rounded-3xl text-center shadow-sm"
                    role="alert"
                >
                    <p className="text-red-800 text-sm font-semibold">{error}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                void doSearch(query, inRefinementMode)
                            }
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-900 hover:border-red-500"
                        >
                            Try again
                        </button>
                        <button
                            type="button"
                            onClick={() => searchInputRef.current?.focus()}
                            className="inline-flex min-h-11 items-center justify-center px-3 py-2.5 text-sm font-semibold text-[var(--color-plum)] hover:underline"
                        >
                            Edit search
                        </button>
                        <button
                            type="button"
                            onClick={resetSearch}
                            className="inline-flex min-h-11 items-center justify-center px-3 py-2.5 text-sm font-semibold text-[var(--color-ink-muted)] hover:underline"
                        >
                            Start fresh
                        </button>
                    </div>
                </div>
            )}

            {/* ── RESULTS ── */}
            {results && !loading && (
                <div className="mt-12 animate-fade-in-up">
                    <div
                        ref={resultSummaryRef}
                        className="mb-5 pl-1 outline-none"
                        role="status"
                        aria-live="polite"
                        tabIndex={-1}
                    >
                        <h2 className="font-display text-xl font-bold text-[var(--color-surface)] leading-relaxed">{results.summary}</h2>
                        <p className="text-sm font-medium text-[var(--color-surface-dim)] mt-3 flex items-center gap-2 flex-wrap">
                            <span className="font-mono tnum">{results.products.length}</span>
                            <span>
                                {isExactItemResult
                                    ? results.products.length === 1
                                        ? "exact Amazon listing"
                                        : "exact Amazon listings"
                                    : "official listings"}
                            </span>
                            {results.enriched && (
                                <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full"
                                    title="Listing fields and available prices fetched from Amazon's official product service at search time"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Live Amazon data
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="mb-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card-solid)]/75 px-4 py-3 text-[11px] leading-relaxed text-[var(--color-ink-dim)]">
                        <p>
                            As an Amazon Associate I earn from qualifying purchases.
                            {results.enriched && results.fetchedAt && (
                                <> Official Amazon fields were fetched at {formatSearchTime(results.fetchedAt)} and can change.</>
                            )}
                        </p>
                        {!isExactItemResult && (
                            <p className="mt-1.5">
                                Badges compare only products in this current official-data shortlist. ProductFindAI does not physically test products.
                            </p>
                        )}
                        {results.enriched && (
                            <details className="mt-2">
                                <summary className="w-fit cursor-pointer font-semibold text-[var(--color-plum)] hover:underline">
                                    Amazon data details
                                </summary>
                                <div className="mt-2 space-y-1.5">
                                    <p>
                                        Product prices and availability are accurate as of the date/time indicated and are subject to change. Any price and availability information displayed on Amazon.com at the time of purchase will apply to the purchase of this product.
                                    </p>
                                    <p>
                                        CERTAIN CONTENT THAT APPEARS ON THIS SITE COMES FROM AMAZON. THIS CONTENT IS PROVIDED &quot;AS IS&quot; AND IS SUBJECT TO CHANGE OR REMOVAL AT ANY TIME.
                                    </p>
                                </div>
                            </details>
                        )}
                    </div>

                    {/* ── COMPARE TABLE — renders only when 2+ items selected ── */}
                    {canCompare && (
                        <div
                            ref={comparisonRef}
                            tabIndex={-1}
                            className="scroll-mt-24 outline-none"
                            role="region"
                            aria-labelledby="product-comparison-heading"
                        >
                            <CompareTable
                                products={compareProducts}
                                onClose={closeComparison}
                                onUnselect={removeFromComparison}
                            />
                        </div>
                    )}

                    {/* Compare-mode hint when exactly 1 item is selected */}
                    {canCompare && compareSet.size === 1 && (
                        <div className="mb-6 mx-1 p-3 bg-[var(--color-accent-muted)] border border-[var(--color-plum)]/15 rounded-2xl text-sm text-[var(--color-plum)] flex items-center gap-2 animate-fade-in">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                            </svg>
                            <span className="font-semibold">Pick 1 more to compare side-by-side.</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        {results.products.slice(0, showAll ? undefined : DEFAULT_VISIBLE_RESULT_COUNT).map((product) => {
                            const isInCompare = compareSet.has(product.rank);
                            const hasVerifiedPrice =
                                product.verified &&
                                !!product.priceEstimate &&
                                !!(product.fetchedAt || results.fetchedAt);
                            const hasVerifiedRating = product.verified && product.rating > 0;
                            return (
                            <article
                                key={product.rank}
                                className={`product-card p-6 sm:p-8 relative overflow-hidden ${isInCompare ? "ring-2 ring-[var(--color-plum)]/40 ring-offset-2 ring-offset-[var(--color-bg)]" : ""}`}
                            >
                                <div className="absolute -top-10 -right-4 font-display text-[120px] font-medium text-[var(--color-bg-warm)] select-none pointer-events-none z-0 tnum">
                                    #{product.rank}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 relative z-10">
                                    <ProductImage product={product} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <ProductBadgePills
                                                badges={product.badges}
                                                className="w-full"
                                            />
                                            {product.tier && (
                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] rounded-md border ${
                                                    product.tier === "budget" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                    product.tier === "premium" ? "bg-amber-50 text-amber-800 border-amber-200" :
                                                    "bg-[var(--color-bg-warm)] text-[var(--color-ink-muted)] border-[var(--color-border)]"
                                                }`}>
                                                    {product.tier === "budget" ? "Budget" : product.tier === "premium" ? "Premium" : "Mid-range"}
                                                </span>
                                            )}
                                            {product.verified && (
                                                <span
                                                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-[0.15em] rounded-md border border-emerald-200"
                                                    title="Live data fetched from Amazon's official product service at search time"
                                                >
                                                    Live data
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-display font-bold text-[var(--color-surface)] text-lg sm:text-xl leading-snug tracking-tight">
                                            {product.title}
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                                            {/* Amazon Associates compliance: a price or rating may only be
                                                shown when it comes from Amazon's official product API.
                                                Until verified === true we show neither — no AI-estimated
                                                numbers presented as Amazon's. */}
                                            {hasVerifiedPrice || hasVerifiedRating ? (
                                                <>
                                                    {hasVerifiedPrice && (
                                                        <span
                                                            className="font-mono tnum text-2xl sm:text-[28px] font-bold text-[var(--color-surface)] tracking-tight"
                                                            title="Live Amazon price"
                                                        >
                                                            {product.priceEstimate}
                                                        </span>
                                                    )}
                                                    {hasVerifiedRating && (
                                                        <StarRating rating={product.rating} reviewCount={product.reviewCount} verified={product.verified} />
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-sm font-semibold text-[var(--color-surface-dim)]">
                                                    See price &amp; rating on Amazon
                                                </span>
                                            )}
                                            <span className="text-[11px] font-semibold text-[var(--color-surface-dim)] px-2.5 py-1 bg-[var(--color-bg-elevated)] rounded-full uppercase tracking-wider">
                                                {product.category}
                                            </span>
                                        </div>

                                        <div className="mt-6 pt-5 border-t border-[var(--color-border)]">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)] mb-2">
                                                {isExactItemResult ? "Official listing evidence" : "Match evidence"}
                                            </p>
                                            <p className="text-[15px] text-[var(--color-surface-muted)] leading-relaxed">
                                                {product.whyThisPick}
                                            </p>
                                            {product.unknownConstraints &&
                                                product.unknownConstraints.length > 0 && (
                                                <div
                                                    className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-950"
                                                    role="note"
                                                >
                                                    <span className="font-bold">
                                                        Unconfirmed in the
                                                        official listing:
                                                    </span>{" "}
                                                    {product.unknownConstraints.join(
                                                        ", ",
                                                    )}
                                                    . Confirm before buying.
                                                </div>
                                            )}
                                        </div>

                                        <ProsConsSummary product={product} />

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-7">
                                            <div className="flex flex-wrap items-stretch gap-2">
                                                {canCompare && (
                                                    <button
                                                        id={`compare-product-${product.rank}`}
                                                        onClick={(e) => { e.stopPropagation(); toggleCompare(product.rank); }}
                                                        aria-pressed={isInCompare}
                                                        disabled={!isInCompare && compareSet.size >= 3}
                                                        className={`text-sm py-3 px-5 rounded-[14px] font-semibold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                                                            isInCompare
                                                                ? "bg-[var(--color-plum)] text-white border border-[var(--color-plum)] shadow-[0_4px_12px_-2px_rgba(0,34,100,0.30)]"
                                                                : "bg-[var(--color-bg-card-solid)] text-[var(--color-ink-muted)] border border-[var(--color-border-strong)] hover:border-[var(--color-plum)] hover:text-[var(--color-plum)]"
                                                        }`}
                                                    >
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            {isInCompare ? (
                                                                <polyline points="20 6 9 17 4 12" />
                                                            ) : (
                                                                <>
                                                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                                                </>
                                                            )}
                                                        </svg>
                                                        {isInCompare ? "In comparison" : "Compare"}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-stretch sm:items-end gap-1.5 sm:ml-auto">
                                                <a
                                                    href={amazonHref(product)}
                                                    target="_blank"
                                                    rel="noopener noreferrer nofollow sponsored"
                                                    className="btn-amazon text-sm py-3 px-7"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {product.verified ? "View on Amazon" : "Search on Amazon"}
                                                </a>
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-ink-dim)] text-center sm:text-right">
                                                    Affiliate link
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                            );
                        })}
                    </div>

                    {!showAll && results.products.length > DEFAULT_VISIBLE_RESULT_COUNT && (
                        <div className="mt-8 flex justify-center pb-8">
                            <button
                                onClick={() => setShowAll(true)}
                                className="btn-secondary px-8 py-3.5"
                            >
                                Show {results.products.length - DEFAULT_VISIBLE_RESULT_COUNT} more
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
