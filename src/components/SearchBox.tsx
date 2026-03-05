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
            className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-2xl object-contain bg-white border border-[var(--color-border)] p-2"
            onError={() => setErrored(true)}
        />
    );
}

function SkeletonCard() {
    return (
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 sm:p-7 animate-pulse">
            <div className="flex gap-5 sm:gap-7">
                <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-2xl bg-[var(--color-bg-elevated)]" />
                <div className="flex-1 space-y-3">
                    <div className="h-3 bg-[var(--color-bg-elevated)] rounded w-1/4" />
                    <div className="h-5 bg-[var(--color-bg-elevated)] rounded w-3/4" />
                    <div className="h-4 bg-[var(--color-bg-elevated)] rounded w-1/3 mt-1" />
                    <div className="h-px bg-[var(--color-border)] mt-4" />
                    <div className="h-3 bg-[var(--color-bg-elevated)] rounded w-full mt-3" />
                    <div className="h-3 bg-[var(--color-bg-elevated)] rounded w-5/6" />
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
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);

    const doSearch = async (q: string, isRefinement = false) => {
        if (!q.trim()) return;
        setError(null);
        setExpandedCard(null);

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
        <div className="w-full max-w-3xl mx-auto">

            {/* ── SEARCH BAR ── always at top */}
            <form onSubmit={handleSubmit}>
                {results && !loading && (
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent)] mb-2">
                        Refine your results
                    </p>
                )}
                <div className="flex items-center bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] focus-within:border-[var(--color-accent)] rounded-2xl overflow-hidden transition-colors shadow-sm">
                    <input
                        className="w-full bg-transparent text-[var(--color-surface)] placeholder-[var(--color-surface-dim)] px-6 py-5 focus:outline-none text-lg font-medium"
                        placeholder={results
                            ? "Narrow it down — e.g. \"under $100\" or \"needs to be wireless\""
                            : "What are you looking for?"}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={loading}
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="btn-primary mx-3 py-3 px-7 text-sm disabled:opacity-40 whitespace-nowrap"
                    >
                        {loading ? "Searching..." : results ? "Refine" : "Find"}
                    </button>
                </div>
                {results && !loading && (
                    <p className="text-xs text-[var(--color-surface-dim)] mt-2">
                        Type above to narrow down · or{" "}
                        <button
                            type="button"
                            onClick={() => { setResults(null); setQuery(""); setMessages([]); setExpandedCard(null); }}
                            className="text-[var(--color-accent)] hover:underline"
                        >
                            start fresh
                        </button>
                    </p>
                )}
            </form>

            {/* ── EXAMPLES ── only on empty state */}
            {!results && !loading && (
                <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2">
                    {EXAMPLES.map((ex) => (
                        <button
                            key={ex}
                            onClick={() => { setQuery(ex); doSearch(ex); }}
                            className="text-xs text-[var(--color-surface-dim)] hover:text-[var(--color-accent)] transition-colors"
                        >
                            {ex}
                        </button>
                    ))}
                </div>
            )}

            {/* ── LOADING SKELETONS ── */}
            {loading && (
                <div className="mt-10 space-y-5">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {/* ── ERROR ── */}
            {error && !loading && (
                <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-xl text-center">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* ── RESULTS ── */}
            {results && !loading && (
                <div className="mt-10 animate-fade-in-up">

                    <div className="mb-8">
                        <p className="font-semibold text-[var(--color-surface)]">{results.summary}</p>
                        <p className="text-xs text-[var(--color-surface-dim)] mt-1">
                            {results.products.length} picks · Prices are estimates · All links go to Amazon
                        </p>
                    </div>

                    <div className="space-y-5">
                        {results.products.map((product) => (
                            <article
                                key={product.rank}
                                className="bg-[var(--color-bg-card)] rounded-2xl p-6 sm:p-7 product-card cursor-pointer"
                            >
                                <div className="flex gap-5 sm:gap-7">

                                    {/* Image */}
                                    <ProductImage asin={product.asin} title={product.title} />

                                    {/* Body */}
                                    <div className="flex-1 min-w-0">

                                        {/* Rank + Title */}
                                        {product.rank === 1 && (
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mb-1">
                                                Top Pick
                                            </p>
                                        )}
                                        <h3 className="font-bold text-[var(--color-surface)] text-base sm:text-lg leading-snug line-clamp-2">
                                            {product.title}
                                        </h3>

                                        {/* Price + meta */}
                                        <div className="flex flex-wrap items-baseline gap-3 mt-2">
                                            <span className="text-xl sm:text-2xl font-bold text-[var(--color-surface)]">
                                                {product.priceEstimate}
                                            </span>
                                            <span className="text-xs text-[var(--color-surface-dim)]">
                                                {product.rating}/5 · {product.category}
                                            </span>
                                        </div>

                                        {/* Why we picked it */}
                                        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-surface-dim)] mb-1.5">
                                                Why we picked it
                                            </p>
                                            <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                                {product.whyThisPick}
                                            </p>
                                        </div>

                                        {/* Footer row */}
                                        <div className="flex items-center justify-between mt-5">
                                            <button
                                                onClick={() => setExpandedCard(expandedCard === product.rank ? null : product.rank)}
                                                className="text-xs text-[var(--color-accent)] hover:underline"
                                            >
                                                {expandedCard === product.rank ? "Hide pros & cons" : "Show pros & cons"}
                                            </button>

                                            <a
                                                href={amazonHref(product)}
                                                target="_blank"
                                                rel="noopener noreferrer nofollow sponsored"
                                                className="btn-amazon text-xs py-2.5 px-5"
                                            >
                                                View on Amazon
                                            </a>
                                        </div>

                                        {/* Pros / Cons */}
                                        {expandedCard === product.rank && (
                                            <div className="mt-4 pt-4 border-t border-[var(--color-border)] grid grid-cols-2 gap-5 animate-fade-in">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-success)] mb-2">
                                                        Pros
                                                    </p>
                                                    <ul className="space-y-1.5">
                                                        {product.pros.map((pro, i) => (
                                                            <li key={i} className="text-xs text-[var(--color-surface-muted)]">
                                                                + {pro}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-danger)] mb-2">
                                                        Cons
                                                    </p>
                                                    <ul className="space-y-1.5">
                                                        {product.cons.map((con, i) => (
                                                            <li key={i} className="text-xs text-[var(--color-surface-muted)]">
                                                                - {con}
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
                </div>
            )}
        </div>
    );
}
