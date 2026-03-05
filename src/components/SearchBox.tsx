"use client";

import { useState } from "react";
import { Search, Loader2, Sparkles, ShoppingBag, Star, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
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

export function SearchBox() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);

    const handleSearch = async (searchQuery?: string) => {
        const q = searchQuery || query;
        if (!q.trim()) return;

        setLoading(true);
        setError(null);
        setResults(null);
        setExpandedCard(null);

        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: q }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Search failed. Please try again.");
                return;
            }

            setResults(data);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch();
    };

    const handleExampleClick = (example: string) => {
        setQuery(example);
        handleSearch(example);
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Search Form */}
            <form onSubmit={handleSubmit} className="relative w-full group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)] via-[#8B5CF6] to-[var(--color-accent)] rounded-2xl blur-md opacity-30 group-hover:opacity-50 group-focus-within:opacity-60 transition duration-500" />

                <div className="relative flex items-center bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-xl overflow-hidden shadow-2xl">
                    <div className="pl-5 text-[var(--color-accent)]">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <input
                        className="w-full bg-transparent text-[var(--color-surface)] placeholder-[var(--color-surface-dim)] px-4 py-5 focus:outline-none text-base sm:text-lg"
                        placeholder="What are you looking for?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="flex items-center gap-2 px-6 py-3 mr-2 bg-[var(--color-accent)] hover:brightness-110 text-white font-semibold rounded-lg disabled:opacity-40 transition-all text-sm"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Find
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Example searches */}
            {!results && !loading && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {EXAMPLE_SEARCHES.map((example) => (
                        <button
                            key={example}
                            onClick={() => handleExampleClick(example)}
                            className="px-3 py-1.5 text-xs rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-surface-muted)] hover:text-white hover:border-[var(--color-accent)] transition-colors"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="mt-10 text-center animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--color-accent)]" />
                    <p className="mt-4 text-sm text-[var(--color-surface-muted)]">
                        Analyzing thousands of products to find the best picks...
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Results */}
            {results && (
                <div className="mt-10 animate-fade-in-up">
                    {/* Summary */}
                    <div className="text-center mb-8">
                        <p className="text-lg font-medium text-[var(--color-surface)]">
                            {results.summary}
                        </p>
                        <p className="text-xs text-[var(--color-surface-dim)] mt-2">
                            {results.products.length} products found • Prices are estimates
                        </p>
                    </div>

                    {/* Product Cards */}
                    <div className="space-y-4">
                        {results.products.map((product) => (
                            <div
                                key={product.rank}
                                className="card p-5 bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Rank Badge */}
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${product.rank === 1
                                            ? "bg-[var(--color-accent)] text-white"
                                            : "bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-surface-muted)]"
                                        }`}>
                                        #{product.rank}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-base leading-snug">{product.title}</h3>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="font-mono text-sm font-bold text-[var(--color-accent)]">{product.priceEstimate}</span>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-xs text-[var(--color-surface-muted)]">{product.rating}</span>
                                                    </div>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-surface-dim)]">
                                                        {product.category}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Amazon CTA */}
                                            <a
                                                href={product.asin === "SEARCH"
                                                    ? `https://www.amazon.com/s?k=${encodeURIComponent(product.title)}&tag=${process.env.NEXT_PUBLIC_AMAZON_TAG || "purefind-20"}`
                                                    : buildAffiliateUrl(product.asin)
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer nofollow sponsored"
                                                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-[var(--color-amazon)] hover:bg-[var(--color-amazon-hover)] text-[#111] text-xs font-bold rounded-lg transition-colors"
                                            >
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                                View on Amazon
                                            </a>
                                        </div>

                                        {/* Why this pick */}
                                        <p className="mt-3 text-sm text-[var(--color-surface-muted)] italic border-l-2 border-[var(--color-accent)]/30 pl-3">
                                            {product.whyThisPick}
                                        </p>

                                        {/* Expand/Collapse Pros/Cons */}
                                        <button
                                            onClick={() => setExpandedCard(expandedCard === product.rank ? null : product.rank)}
                                            className="mt-3 flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
                                        >
                                            {expandedCard === product.rank ? (
                                                <>Hide details <ChevronUp className="w-3 h-3" /></>
                                            ) : (
                                                <>Show pros & cons <ChevronDown className="w-3 h-3" /></>
                                            )}
                                        </button>

                                        {expandedCard === product.rank && (
                                            <div className="mt-3 grid grid-cols-2 gap-4 animate-fade-in">
                                                <div className="space-y-1.5">
                                                    {product.pros.map((pro, i) => (
                                                        <div key={i} className="text-xs text-[var(--color-success)] flex gap-1.5">
                                                            <span className="opacity-60">+</span>{pro}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="space-y-1.5">
                                                    {product.cons.map((con, i) => (
                                                        <div key={i} className="text-xs text-[var(--color-danger)] flex gap-1.5">
                                                            <span className="opacity-60">−</span>{con}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search again */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => { setResults(null); setQuery(""); }}
                            className="text-sm text-[var(--color-accent)] hover:underline flex items-center gap-1 mx-auto"
                        >
                            <ArrowRight className="w-3 h-3" /> Search for something else
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
