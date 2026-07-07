"use client";

import { useState, useMemo, useEffect } from "react";
import { buildAffiliateUrl, buildAffiliateSearchUrl } from "@/lib/affiliate";
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
    reviewCount?: number;
    verified?: boolean;
    tier?: "budget" | "mid" | "premium";
    confidence?: "high" | "medium" | "low";
}

interface SearchResult {
    summary: string;
    products: Product[];
    enriched?: boolean;
    fetchedAt?: string;
}

function extractAsinFromText(text: string): string | null {
    const match = text.match(/(?:dp|product|gp\/product|d)\/([A-Z0-9]{10})(?:[/?]|$)/i);
    return match ? match[1].toUpperCase() : null;
}

function isAmazonUrl(text: string): boolean {
    return /amazon\.com/i.test(text) && extractAsinFromText(text) !== null;
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
    return (
        <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-surface-dim)]"
            title={verified ? "Live Amazon rating" : "Confirm rating on Amazon"}
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

const CACHE_PREFIX = "pf-search:";

function hasAmazonProductContent(data: SearchResult): boolean {
    return !!data.enriched || data.products.some((product) => !!product.verified);
}

function getCached(q: string): SearchResult | null {
    try {
        const key = CACHE_PREFIX + q.toLowerCase().trim();
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as SearchResult;
        if (hasAmazonProductContent(parsed)) {
            sessionStorage.removeItem(key);
            return null;
        }
        return parsed;
    } catch { return null; }
}

function setCached(q: string, data: SearchResult) {
    try {
        if (hasAmazonProductContent(data)) return;
        sessionStorage.setItem(CACHE_PREFIX + q.toLowerCase().trim(), JSON.stringify(data));
    } catch { /* quota exceeded — ignore */ }
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

// POST /api/search with automatic retry. The engine occasionally returns a 5xx
// (a transient Gemini hiccup surfaces as 503 "temporarily unavailable"); a quick
// retry recovers it before the user ever sees an error. 4xx — including a 429
// rate-limit — is surfaced immediately, never retried.
async function postSearch(
    payload: unknown,
    attempts = 3,
): Promise<{ ok: true; data: SearchResult } | { ok: false; error: string }> {
    for (let i = 0; i < attempts; i++) {
        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) return { ok: true, data: (await res.json()) as SearchResult };
            if (res.status >= 500 && i < attempts - 1) {
                await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
                continue;
            }
            const errData = await res.json().catch(() => ({}));
            return { ok: false, error: (errData as { error?: string }).error || "Search failed. Please try again." };
        } catch {
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
    const [expandedCard, setExpandedCard] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [compareSet, setCompareSet] = useState<Set<number>>(new Set());

    // Let the hero know when a search owns the viewport (loading or results
    // showing) so it can tuck away the demo shortlist and proof chips.
    useEffect(() => {
        onActiveChange?.(loading || !!results);
    }, [loading, results, onActiveChange]);

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

    const handleQueryChange = (val: string) => {
        setQuery(val);
        if (isAmazonUrl(val)) {
            setDetectedAsin(extractAsinFromText(val));
        } else {
            setDetectedAsin(null);
        }
    };

    const resetSearch = () => {
        setResults(null);
        setQuery("");
        setOriginalQuery(null);
        setRefinementChain([]);
        setExpandedCard(null);
        setDetectedAsin(null);
        setCompareSet(new Set());
    };

    const doSearch = async (q: string, isRefinement = false) => {
        if (!q.trim()) return;
        const asin = extractAsinFromText(q);
        if (asin && isAmazonUrl(q)) {
            q = `I'm looking at Amazon product ASIN ${asin}. Show me this exact product first, then find similar alternatives that may fit the same use case better.`;
            setDetectedAsin(null);
        }
        setError(null);
        setExpandedCard(null);
        setShowAll(false);
        setCompareSet(new Set());

        if (!isRefinement) {
            const cached = getCached(q);
            if (cached) {
                setResults(cached);
                setOriginalQuery(q);
                setRefinementChain([]);
                setQuery("");
                return;
            }
            setResults(null);
        }

        setLoading(true);

        // Build the refinement payload — server sees `priorProducts` and treats
        // the new query as a narrowing constraint, not a fresh search.
        const body = isRefinement && results
            ? {
                messages: [{ role: "user", content: q }],
                originalQuery: originalQuery ?? q,
                priorProducts: results.products.map((p) => ({
                    rank: p.rank,
                    title: p.title,
                    category: p.category,
                })),
            }
            : {
                messages: [{ role: "user", content: q }],
            };

        const result = await postSearch(body);
        if (result.ok) {
            const data = result.data;
            setResults(data);
            if (isRefinement) {
                setRefinementChain((chain) => [...chain, q]);
            } else {
                setOriginalQuery(q);
                setRefinementChain([]);
                setCached(q, data);
            }
            setQuery("");
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        doSearch(query, !!results);
    };

    const inRefinementMode = !!results;
    const refinementCount = results?.products.length ?? 0;

    const amazonHref = (p: Product) => {
        const cleanAsin = typeof p.asin === "string" ? p.asin.trim() : "";
        if (!cleanAsin || cleanAsin === "SEARCH") {
            return buildAffiliateSearchUrl(p.title);
        }
        return buildAffiliateUrl(cleanAsin);
    };

    return (
        <div className="w-full max-w-3xl mx-auto relative z-20">

            {/* ── REFINEMENT BREADCRUMB CHAIN ── */}
            {inRefinementMode && !loading && (originalQuery || refinementChain.length > 0) && (
                <div className="mb-4 flex items-center gap-2 flex-wrap text-xs font-medium text-[var(--color-ink-muted)] animate-fade-in">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-plum)]">
                        Searching within {refinementCount} {refinementCount === 1 ? "pick" : "picks"}
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
            <form onSubmit={handleSubmit} className="relative group">
                {/* Soft glowing aura — picks up the brand gradient on focus, not the indigo→purple AI-tell */}
                <div className="absolute -inset-1 bg-[var(--color-accent-gradient)] rounded-[30px] opacity-0 group-focus-within:opacity-30 blur-2xl transition duration-500 group-focus-within:duration-200" />

                <div className={`relative flex bg-[var(--color-bg-card-solid)] backdrop-blur-xl rounded-[26px] overflow-hidden transition-all shadow-[0_8px_32px_-12px_rgba(91,33,182,0.18)] ${
                    inRefinementMode ? "items-center" : "flex-col items-stretch sm:flex-row sm:items-center"
                } ${
                    inRefinementMode
                        ? "border-2 border-[var(--color-plum)]/30"
                        : "border border-[var(--color-border-strong)]"
                }`}>
                    {inRefinementMode && (
                        <span className="ml-5 sm:ml-6 flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-plum)]" aria-hidden="true">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="21" y1="21" x2="16.5" y2="16.5" />
                            </svg>
                        </span>
                    )}
                    <input
                        className="min-w-0 w-full bg-transparent text-[var(--color-ink)] placeholder-[var(--color-ink-dim)] px-5 py-4 sm:px-7 sm:py-6 focus:outline-none text-base sm:text-xl font-medium"
                        placeholder={inRefinementMode
                            ? `Add a detail: "under $100", "wireless", "small office"`
                            : placeholder}
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        disabled={loading}
                        autoComplete="off"
                        aria-label={inRefinementMode ? "Search within current picks" : "Search for an Amazon product"}
                    />
                    {detectedAsin && (
                        <span className="mx-3 px-3 py-1.5 bg-[var(--color-accent-muted)] border border-[var(--color-plum)]/20 text-[var(--color-plum)] text-xs font-semibold rounded-full whitespace-nowrap flex items-center gap-1.5 flex-shrink-0">
                            Amazon link detected
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className={`btn-primary py-3 px-4 sm:py-3.5 sm:px-8 text-sm sm:text-base disabled:opacity-80 disabled:cursor-not-allowed whitespace-nowrap ${
                            inRefinementMode
                                ? "mx-2 sm:mx-3"
                                : "mx-3 mb-3 w-[calc(100%-1.5rem)] sm:mx-3 sm:mb-0 sm:w-auto"
                        }`}
                    >
                        {loading ? "Working…" : detectedAsin ? "Compare" : inRefinementMode ? "Update picks" : "Find my picks"}
                    </button>
                </div>
                {inRefinementMode && !loading && (
                    <p className="text-xs font-medium text-[var(--color-ink-dim)] mt-3 pl-1 leading-relaxed">
                        ProductFindAI keeps your first search in mind and adds your new detail.{" "}
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
                    <div className="text-center mb-2">
                        <p className="text-sm text-[var(--color-surface-muted)] font-medium">
                            Finding the right products…
                        </p>
                    </div>
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {/* ── ERROR ── */}
            {error && !loading && (
                <div className="mt-8 p-6 bg-red-50/80 backdrop-blur-md border border-red-200 rounded-3xl text-center shadow-sm">
                    <p className="text-red-600 text-sm font-semibold">{error}</p>
                </div>
            )}

            {/* ── RESULTS ── */}
            {results && !loading && (
                <div className="mt-12 animate-fade-in-up">
                    <div className="text-[11px] text-[var(--color-surface-dim)] mb-4 pl-2 leading-relaxed space-y-1.5">
                        <p>
                            Links below are affiliate links. As an Amazon Associate I earn from qualifying purchases.
                        </p>
                        {results.enriched && (
                            <>
                                <p>
                                    Product prices and availability are accurate as of the date/time indicated and are subject to change. Any price and availability information displayed on Amazon.com at the time of purchase will apply to the purchase of this product. Search time: {formatSearchTime(results.fetchedAt)}.
                                </p>
                                <p>
                                    CERTAIN CONTENT THAT APPEARS ON THIS SITE COMES FROM AMAZON. THIS CONTENT IS PROVIDED &quot;AS IS&quot; AND IS SUBJECT TO CHANGE OR REMOVAL AT ANY TIME.
                                </p>
                            </>
                        )}
                    </div>
                    <div className="mb-10 text-center sm:text-left pl-2">
                        <p className="font-display text-xl font-bold text-[var(--color-surface)] leading-relaxed">{results.summary}</p>
                        <p className="text-sm font-medium text-[var(--color-surface-dim)] mt-3 flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                            <span className="font-mono tnum">{results.products.length}</span>
                            <span>recommendations</span>
                            {results.enriched && (
                                <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full"
                                    title="Prices and ratings fetched from Amazon's official product API at search time"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Live Amazon data
                                </span>
                            )}
                        </p>
                    </div>

                    {/* ── COMPARE TABLE — renders only when 2+ items selected ── */}
                    <CompareTable
                        products={compareProducts}
                        onClose={() => setCompareSet(new Set())}
                        onUnselect={(rank) => toggleCompare(rank)}
                    />

                    {/* Compare-mode hint when exactly 1 item is selected */}
                    {compareSet.size === 1 && (
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
                        {results.products.slice(0, showAll ? undefined : 5).map((product) => {
                            const isInCompare = compareSet.has(product.rank);
                            const hasVerifiedPrice = product.verified && !!product.priceEstimate;
                            const hasVerifiedRating = product.verified && product.rating > 0;
                            return (
                            <article
                                key={product.rank}
                                className={`product-card p-6 sm:p-8 cursor-pointer relative overflow-hidden ${isInCompare ? "ring-2 ring-[var(--color-plum)]/40 ring-offset-2 ring-offset-[var(--color-bg)]" : ""}`}
                            >
                                <div className="absolute -top-10 -right-4 font-display text-[120px] font-medium text-[var(--color-bg-warm)] select-none pointer-events-none z-0 tnum">
                                    #{product.rank}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 relative z-10">
                                    <ProductImage product={product} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            {product.rank === 1 && (
                                                <span className="px-3 py-1 bg-[var(--color-accent-muted)] text-[var(--color-plum)] text-[10px] font-bold uppercase tracking-[0.18em] rounded-md">
                                                    Top pick
                                                </span>
                                            )}
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
                                                    title="Live data fetched from Amazon's official product API at search time"
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
                                                Why this one
                                            </p>
                                            <p className="text-[15px] text-[var(--color-surface-muted)] leading-relaxed">
                                                {product.whyThisPick}
                                            </p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-7">
                                            <div className="flex flex-wrap items-stretch gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setExpandedCard(expandedCard === product.rank ? null : product.rank); }}
                                                    className="btn-secondary text-sm py-3"
                                                >
                                                    {expandedCard === product.rank ? "Hide pros / cons" : "Show pros / cons"}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleCompare(product.rank); }}
                                                    aria-pressed={isInCompare}
                                                    disabled={!isInCompare && compareSet.size >= 3}
                                                    className={`text-sm py-3 px-5 rounded-[14px] font-semibold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                                                        isInCompare
                                                            ? "bg-[var(--color-plum)] text-white border border-[var(--color-plum)] shadow-[0_4px_12px_-2px_rgba(91,33,182,0.32)]"
                                                            : "bg-[var(--color-bg-card-solid)] text-[var(--color-ink-muted)] border border-[var(--color-border-strong)] hover:border-[var(--color-plum)] hover:text-[var(--color-plum)]"
                                                    }`}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        {isInCompare ? (
                                                            <>
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </>
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
                                            </div>

                                            <div className="flex flex-col items-stretch sm:items-end gap-1.5">
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

                                        {expandedCard === product.rank && (
                                            <div className="mt-6 pt-6 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
                                                <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 mb-3">
                                                        Pros
                                                    </p>
                                                    <ul className="space-y-2.5">
                                                        {product.pros.map((pro, i) => (
                                                            <li key={i} className="text-sm text-[var(--color-surface-muted)] flex items-start gap-2 leading-relaxed">
                                                                <span className="text-emerald-500 mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
                                                                <span>{pro}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-700 mb-3">
                                                        Cons
                                                    </p>
                                                    <ul className="space-y-2.5">
                                                        {product.cons.map((con, i) => (
                                                            <li key={i} className="text-sm text-[var(--color-surface-muted)] flex items-start gap-2 leading-relaxed">
                                                                <span className="text-red-400 mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" aria-hidden="true" />
                                                                <span>{con}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                            );
                        })}
                    </div>

                    {!showAll && results.products.length > 5 && (
                        <div className="mt-8 flex justify-center pb-8">
                            <button
                                onClick={() => setShowAll(true)}
                                className="btn-secondary px-8 py-3.5"
                            >
                                Show {results.products.length - 5} more
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
