"use client";

import { useState } from "react";
import { buildAffiliateUrl } from "@/lib/affiliate";

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
}

interface SearchResult {
    summary: string;
    products: Product[];
}

function extractAsinFromText(text: string): string | null {
    const match = text.match(/(?:dp|product|gp\/product|d)\/([A-Z0-9]{10})(?:[/?]|$)/i);
    return match ? match[1].toUpperCase() : null;
}

function isAmazonUrl(text: string): boolean {
    return /amazon\.com/i.test(text) && extractAsinFromText(text) !== null;
}

const EXAMPLES = [
    "Best noise cancelling headphones under $200",
    "Quiet mechanical keyboard for office",
    "Standing desk for small spaces",
    "Best air fryer for a family of 4",
];

function ProductImage({ asin, title }: { asin: string; title: string }) {
    const [errored, setErrored] = useState(false);

    if (asin === "SEARCH" || errored) {
        return (
            <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-2xl bg-[var(--color-bg-elevated)]" />
        );
    }

    return (
        <img
            src={`/api/image?asin=${asin}`}
            alt={title}
            width={144}
            height={144}
            className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-2xl object-contain bg-white border border-[var(--color-border)] p-2 shadow-sm"
            onError={() => setErrored(true)}
        />
    );
}

function SkeletonCard() {
    return (
        <div className="product-card p-6 sm:p-7 shimmer-bg">
            <div className="flex gap-5 sm:gap-7">
                <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-2xl bg-slate-200/50" />
                <div className="flex-1 space-y-4 py-2">
                    <div className="h-4 bg-slate-200/50 rounded-full w-1/4" />
                    <div className="h-6 bg-slate-200/50 rounded-full w-3/4" />
                    <div className="h-5 bg-slate-200/50 rounded-full w-1/3 mt-2" />
                    <div className="h-px bg-[var(--color-border)] mt-5 mb-2" />
                    <div className="h-4 bg-slate-200/50 rounded-full w-full" />
                    <div className="h-4 bg-slate-200/50 rounded-full w-5/6" />
                </div>
            </div>
        </div>
    );
}

const CACHE_PREFIX = "pf-search:";

function getCached(q: string): SearchResult | null {
    try {
        const raw = sessionStorage.getItem(CACHE_PREFIX + q.toLowerCase().trim());
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function setCached(q: string, data: SearchResult) {
    try {
        sessionStorage.setItem(CACHE_PREFIX + q.toLowerCase().trim(), JSON.stringify(data));
    } catch { /* quota exceeded — ignore */ }
}

export function SearchBox() {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [query, setQuery] = useState("");
    const [detectedAsin, setDetectedAsin] = useState<string | null>(null);
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);

    const handleQueryChange = (val: string) => {
        setQuery(val);
        if (isAmazonUrl(val)) {
            setDetectedAsin(extractAsinFromText(val));
        } else {
            setDetectedAsin(null);
        }
    };

    const doSearch = async (q: string, isRefinement = false) => {
        if (!q.trim()) return;
        // If user pasted an Amazon link, rewrite query to ask for that product + alternatives
        const asin = extractAsinFromText(q);
        if (asin && isAmazonUrl(q)) {
            q = `I'm looking at Amazon product ASIN ${asin}. Show me this exact product first, then find me similar alternatives that are better — better reviews, better price, or better overall value for the same use case.`;
            setDetectedAsin(null);
        }
        setError(null);
        setExpandedCard(null);
        setShowAll(false);

        // Check session cache for non-refinement searches
        if (!isRefinement) {
            const cached = getCached(q);
            if (cached) {
                setResults(cached);
                setMessages([
                    { role: "user", content: q },
                    { role: "assistant", content: JSON.stringify(cached) },
                ]);
                return;
            }
            setResults(null);
        }

        setLoading(true);

        const newMessages = isRefinement
            ? [...messages, { role: "user", content: q }]
            : [{ role: "user", content: q }];

        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!res.ok || !res.body) {
                const errData = await res.json().catch(() => ({}));
                setError((errData as { error?: string }).error || "Search failed. Please try again.");
                return;
            }

            // Read the stream and accumulate text
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let text = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                text += decoder.decode(value, { stream: true });
            }

            const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const data: SearchResult = JSON.parse(cleaned);

            setResults(data);
            setMessages([...newMessages, { role: "assistant", content: JSON.stringify(data) }]);
            if (!isRefinement) setCached(q, data);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        doSearch(query, !!results);
    };

    const amazonHref = (p: Product) =>
        p.asin === "SEARCH"
            ? `https://www.amazon.com/s?k=${encodeURIComponent(p.title)}&tag=${process.env.NEXT_PUBLIC_AMAZON_TAG ?? "purefind-20"}`
            : buildAffiliateUrl(p.asin);

    return (
        <div className="w-full max-w-3xl mx-auto relative z-20">

            {/* ── SEARCH BAR ── */}
            <form onSubmit={handleSubmit} className="relative group">
                {results && !loading && (
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent)] mb-3">
                        Refine your results
                    </p>
                )}

                {/* The glowing border effect on focus */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-accent)] to-purple-500 rounded-[28px] opacity-0 group-focus-within:opacity-100 blur transition duration-500 group-focus-within:duration-200" />

                <div className="relative flex items-center bg-white/90 backdrop-blur-3xl border border-[var(--color-border-strong)] rounded-[26px] overflow-hidden transition-all shadow-xl shadow-slate-200/50">
                    <input
                        className="w-full bg-transparent text-[var(--color-surface)] placeholder-[var(--color-surface-dim)] px-8 py-6 focus:outline-none text-xl font-semibold"
                        placeholder={results
                            ? "Narrow it down — e.g. \"under $100\" or \"wireless\""
                            : "What are you looking for? Or paste an Amazon link."}
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        disabled={loading}
                        autoComplete="off"
                    />
                    {detectedAsin && (
                        <span className="mx-3 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1.5 flex-shrink-0">
                            🔗 Amazon link
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="btn-primary mx-3 py-4 px-8 text-base disabled:opacity-50 whitespace-nowrap shadow-md"
                    >
                        {loading ? "Searching..." : detectedAsin ? "Compare" : results ? "Search Within" : "Find Specs"}
                    </button>
                </div>
                {results && !loading && (
                    <p className="text-xs font-semibold text-[var(--color-surface-dim)] mt-4">
                        Type above to narrow down · or{" "}
                        <button
                            type="button"
                            onClick={() => { setResults(null); setQuery(""); setMessages([]); setExpandedCard(null); setDetectedAsin(null); }}
                            className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:underline transition-colors"
                        >
                            start fresh
                        </button>
                    </p>
                )}
            </form>

            {/* ── EXAMPLES ── */}
            {!results && !loading && (
                <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-3">
                    {EXAMPLES.map((ex, i) => (
                        <button
                            key={ex}
                            onClick={() => { setQuery(ex); doSearch(ex); }}
                            className={`px-4 py-2 rounded-full glass text-xs font-medium text-[var(--color-surface-muted)] hover:text-[var(--color-accent)] hover:bg-white transition-all animate-fade-in-up stagger-${(i % 4) + 1}`}
                        >
                            {ex}
                        </button>
                    ))}
                </div>
            )}

            {/* ── LOADING SKELETONS ── */}
            {loading && (
                <div className="mt-12 space-y-6 animate-fade-in">
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
                    <div className="mb-10 text-left pl-2 text-center sm:text-left">
                        <p className="text-xl font-bold text-[var(--color-surface)] leading-relaxed">{results.summary}</p>
                        <p className="text-sm font-medium text-[var(--color-surface-dim)] mt-3">
                            {results.products.length} AI-verified recommendations · Prices are estimates
                        </p>
                    </div>

                    <div className="space-y-6">
                        {results.products.slice(0, showAll ? undefined : 5).map((product) => (
                            <article
                                key={product.rank}
                                className="product-card p-6 sm:p-8 cursor-pointer relative overflow-hidden"
                            >
                                {/* Subtle rank watermark */}
                                <div className="absolute -top-10 -right-4 text-[120px] font-black text-slate-100/50 select-none pointer-events-none z-0">
                                    #{product.rank}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 relative z-10">
                                    {/* Image */}
                                    <ProductImage asin={product.asin} title={product.title} />

                                    {/* Body */}
                                    <div className="flex-1 min-w-0">
                                        {/* Rank + Title */}
                                        <div className="flex items-center gap-3 mb-2">
                                            {product.rank === 1 && (
                                                <span className="px-3 py-1 bg-[var(--color-accent-muted)] text-[var(--color-accent)] text-xs font-black uppercase tracking-widest rounded-md">
                                                    Top Pick
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-[var(--color-surface)] text-lg sm:text-xl leading-snug">
                                            {product.title}
                                        </h3>

                                        {/* Price + meta */}
                                        <div className="flex flex-wrap items-baseline gap-4 mt-3">
                                            <span className="text-2xl sm:text-3xl font-black text-[var(--color-surface)]">
                                                {product.priceEstimate}
                                            </span>
                                            <span className="text-sm font-semibold text-[var(--color-surface-dim)] flex items-center gap-1.5">
                                                <span className="text-amber-400 text-base">★</span> {product.rating}/5
                                                <span className="mx-1">·</span> {product.category}
                                            </span>
                                        </div>

                                        {/* Why we picked it */}
                                        <div className="mt-6 pt-5 border-t border-[var(--color-border)]">
                                            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-accent)] mb-2">
                                                Why we picked it
                                            </p>
                                            <p className="text-base text-[var(--color-surface-muted)] leading-relaxed font-medium">
                                                {product.whyThisPick}
                                            </p>
                                        </div>

                                        {/* Footer row */}
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setExpandedCard(expandedCard === product.rank ? null : product.rank); }}
                                                className="w-full sm:w-auto btn-secondary text-sm py-3"
                                            >
                                                {expandedCard === product.rank ? "Hide deep dive" : "Show pros & cons"}
                                            </button>

                                            <a
                                                href={amazonHref(product)}
                                                target="_blank"
                                                rel="noopener noreferrer nofollow sponsored"
                                                className="w-full sm:w-auto btn-amazon text-sm py-3 px-8"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Check Amazon Price
                                            </a>
                                        </div>

                                        {/* Pros / Cons */}
                                        {expandedCard === product.rank && (
                                            <div className="mt-6 pt-6 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 gap-8 animate-fade-in">
                                                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                                                    <p className="text-xs font-black uppercase tracking-widest text-[var(--color-success)] mb-3 flex items-center gap-2">
                                                        <span>✓</span> Advantages
                                                    </p>
                                                    <ul className="space-y-2.5">
                                                        {product.pros.map((pro, i) => (
                                                            <li key={i} className="text-sm font-medium text-[var(--color-surface-muted)] flex items-start gap-2">
                                                                <span className="text-emerald-500 mt-0.5">•</span>
                                                                {pro}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100/50">
                                                    <p className="text-xs font-black uppercase tracking-widest text-[var(--color-danger)] mb-3 flex items-center gap-2">
                                                        <span>✕</span> Drawbacks
                                                    </p>
                                                    <ul className="space-y-2.5">
                                                        {product.cons.map((con, i) => (
                                                            <li key={i} className="text-sm font-medium text-[var(--color-surface-muted)] flex items-start gap-2">
                                                                <span className="text-red-400 mt-0.5">•</span>
                                                                {con}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {!showAll && results.products.length > 5 && (
                        <div className="mt-8 flex justify-center pb-8">
                            <button
                                onClick={() => setShowAll(true)}
                                className="btn-secondary px-8 py-3.5 shadow-sm bg-white hover:bg-slate-50 border border-slate-200"
                            >
                                Show {results.products.length - 5} more results
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
