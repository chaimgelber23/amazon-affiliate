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
    error?: string;
}

const EXAMPLE_SEARCHES = [
    "Best noise cancelling headphones under $200",
    "Quiet mechanical keyboard for office",
    "Standing desk for small spaces",
    "Best air fryer for a family of 4",
    "Running shoes for flat feet",
];

function ProductImage({ asin, title }: { asin: string; title: string }) {
    const [errored, setErrored] = useState(false);

    if (asin === "SEARCH" || errored) {
        return (
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]" />
        );
    }

    return (
        <img
            src={`https://m.media-amazon.com/images/P/${asin}.01._SX300_SCLZZZZZZZ_.jpg`}
            alt={title}
            className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl object-contain bg-white border border-[var(--color-border)]"
            onError={() => setErrored(true)}
        />
    );
}

export function SearchBox() {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);

    const handleSearch = async (searchQuery: string, isFollowUp = false) => {
        const q = searchQuery.trim();
        if (!q) return;

        setLoading(true);
        setError(null);
        setExpandedCard(null);

        const newMessages = isFollowUp
            ? [...messages, { role: "user", content: q }]
            : [{ role: "user", content: q }];

        if (!isFollowUp) setResults(null);

        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Search failed. Please try again.");
                return;
            }

            setResults(data);
            setMessages([...newMessages, { role: "assistant", content: JSON.stringify(data) }]);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (results) {
            handleSearch(query, true);
        } else {
            handleSearch(query, false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">

            {/* Search Input — always visible */}
            <form onSubmit={handleSubmit} className="w-full">
                <div className="flex items-center bg-white border-2 border-[var(--color-border)] focus-within:border-[var(--color-accent)] rounded-2xl overflow-hidden transition-colors shadow-sm">
                    <input
                        className="w-full bg-transparent text-[var(--color-surface)] placeholder-[var(--color-surface-dim)] px-6 py-5 focus:outline-none text-lg font-medium"
                        placeholder="What are you looking for?"
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
            </form>

            {/* Example searches — only when no results */}
            {!results && !loading && (
                <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2">
                    {EXAMPLE_SEARCHES.map((example) => (
                        <button
                            key={example}
                            onClick={() => { setQuery(example); handleSearch(example); }}
                            className="text-xs text-[var(--color-surface-dim)] hover:text-[var(--color-accent)] transition-colors"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="mt-14 text-center">
                    <p className="text-[var(--color-surface-muted)] font-medium text-sm tracking-wide">
                        Scanning Amazon for the best match...
                    </p>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-xl text-center">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Results */}
            {results && !loading && (
                <div className="mt-10 animate-fade-in-up">

                    {/* Summary */}
                    <div className="mb-6">
                        <p className="text-[var(--color-surface)] font-medium">{results.summary}</p>
                        <p className="text-xs text-[var(--color-surface-dim)] mt-1">
                            {results.products.length} recommendations · Prices are estimates · Links go to Amazon
                        </p>
                    </div>

                    {/* Product Cards */}
                    <div className="space-y-4">
                        {results.products.map((product) => (
                            <div
                                key={product.rank}
                                className="bg-white border border-[var(--color-border)] rounded-2xl p-5 hover:border-[var(--color-border-strong)] hover:shadow-md transition-all"
                            >
                                <div className="flex gap-4">
                                    {/* Product Image */}
                                    <ProductImage asin={product.asin} title={product.title} />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                {product.rank === 1 && (
                                                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mb-1">
                                                        Top Pick
                                                    </span>
                                                )}
                                                <h3 className="font-bold text-[var(--color-surface)] leading-snug text-sm sm:text-base line-clamp-2">
                                                    {product.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    <span className="text-base font-bold text-[var(--color-surface)]">
                                                        {product.priceEstimate}
                                                    </span>
                                                    <span className="text-xs text-[var(--color-surface-dim)]">
                                                        {product.rating}/5
                                                    </span>
                                                    <span className="text-xs text-[var(--color-surface-dim)] hidden sm:inline">
                                                        · {product.category}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Amazon CTA */}
                                            <a
                                                href={
                                                    product.asin === "SEARCH"
                                                        ? `https://www.amazon.com/s?k=${encodeURIComponent(product.title)}&tag=${process.env.NEXT_PUBLIC_AMAZON_TAG ?? "purefind-20"}`
                                                        : buildAffiliateUrl(product.asin)
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer nofollow sponsored"
                                                className="flex-shrink-0 btn-amazon text-xs py-2 px-3 sm:px-4"
                                            >
                                                View on Amazon
                                            </a>
                                        </div>

                                        {/* Why this pick */}
                                        <p className="mt-2.5 text-sm text-[var(--color-surface-muted)] leading-relaxed border-l-2 border-[var(--color-accent)] pl-3">
                                            {product.whyThisPick}
                                        </p>

                                        {/* Pros / Cons toggle */}
                                        <button
                                            onClick={() => setExpandedCard(expandedCard === product.rank ? null : product.rank)}
                                            className="mt-2.5 text-xs text-[var(--color-accent)] hover:underline"
                                        >
                                            {expandedCard === product.rank ? "Hide details" : "Show pros & cons"}
                                        </button>

                                        {expandedCard === product.rank && (
                                            <div className="mt-3 pt-3 border-t border-[var(--color-border)] grid grid-cols-2 gap-4 animate-fade-in">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-success)] mb-2">Pros</p>
                                                    <ul className="space-y-1">
                                                        {product.pros.map((pro, i) => (
                                                            <li key={i} className="text-xs text-[var(--color-surface-muted)]">+ {pro}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-danger)] mb-2">Cons</p>
                                                    <ul className="space-y-1">
                                                        {product.cons.map((con, i) => (
                                                            <li key={i} className="text-xs text-[var(--color-surface-muted)]">- {con}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* New search */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => { setResults(null); setQuery(""); setMessages([]); setExpandedCard(null); }}
                            className="text-sm text-[var(--color-surface-dim)] hover:text-[var(--color-accent)] transition-colors"
                        >
                            Start a new search
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
