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
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [query, setQuery] = useState("");
    const [followUpQuery, setFollowUpQuery] = useState("");
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);

    const handleSearch = async (searchQuery?: string, isFollowUp: boolean = false) => {
        const q = searchQuery || (isFollowUp ? followUpQuery : query);
        if (!q.trim()) return;

        setLoading(true);
        setError(null);
        setExpandedCard(null);

        // If it's a new search, clear previous results
        if (!isFollowUp) {
            setResults(null);
        }

        const newMessages = isFollowUp
            ? [...messages, { role: "user", content: q }]
            : [{ role: "user", content: q }];

        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages, query: q }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Search failed. Please try again.");
                return;
            }

            setResults(data);
            setMessages(newMessages);
            if (isFollowUp) setFollowUpQuery("");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(undefined, false);
    };

    const handleFollowUpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(undefined, true);
    };

    const handleExampleClick = (example: string) => {
        setQuery(example);
        handleSearch(example);
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Initial Search Form (hidden when results exist) */}
            {!results && (
                <>
                    <form onSubmit={handleSubmit} className="relative w-full group">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)] via-[#8B5CF6] to-[var(--color-pink)] rounded-2xl blur-lg opacity-40 group-hover:opacity-60 group-focus-within:opacity-75 transition duration-500 animate-pulse" />

                        <div className="relative flex items-center glass rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.15)]">
                            <div className="pl-6 text-[var(--color-accent)]">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <input
                                className="w-full bg-transparent text-[var(--color-surface)] placeholder-[var(--color-surface-dim)] px-5 py-6 focus:outline-none text-lg sm:text-xl font-medium tracking-wide"
                                placeholder="What are you looking for?"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="flex items-center gap-2 px-8 py-4 mr-3 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-purple)] hover:brightness-110 text-white font-bold rounded-xl disabled:opacity-40 transition-all text-base shadow-[0_0_20px_rgba(178,0,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Find
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Example searches */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        {EXAMPLE_SEARCHES.map((example) => (
                            <button
                                key={example}
                                onClick={() => handleExampleClick(example)}
                                className="px-4 py-2 text-xs font-medium rounded-full glass border border-[rgba(255,255,255,0.05)] text-[var(--color-surface-muted)] hover:text-white hover:border-[rgba(255,255,255,0.2)] hover:bg-[var(--color-bg-elevated)] transition-all duration-300"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Loading */}
            {loading && (
                <div className="mt-16 text-center animate-pulse">
                    <div className="relative inline-flex items-center justify-center p-6 rounded-3xl glass border border-[rgba(255,255,255,0.1)] mb-6 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-purple)] rounded-3xl opacity-20 blur-xl"></div>
                        <Loader2 className="relative w-12 h-12 text-[var(--color-accent)] animate-spin" />
                    </div>
                    <p className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                        Scanning Amazon for the perfect match...
                    </p>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div className="mt-8 p-6 glass border border-red-500/30 rounded-2xl text-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    <p className="text-red-400 font-medium text-lg">{error}</p>
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
                                className="card p-6"
                            >
                                <div className="flex items-start gap-5">
                                    {/* Rank Badge */}
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${product.rank === 1
                                        ? "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] text-white shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                                        : "glass border border-[rgba(255,255,255,0.1)] text-[var(--color-surface)]"
                                        }`}>
                                        #{product.rank}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-display font-bold text-xl leading-snug">{product.title}</h3>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="font-mono text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)]">{product.priceEstimate}</span>
                                                    <div className="flex items-center gap-1.5 bg-[var(--color-bg)]/50 px-2 py-1 rounded-md border border-[rgba(255,255,255,0.05)]">
                                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-xs font-semibold text-[var(--color-surface)]">{product.rating}</span>
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

                    {/* Follow-up / Conversational UI */}
                    <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.05)]">
                        <form onSubmit={handleFollowUpSubmit} className="relative w-full max-w-2xl mx-auto group">
                            <div className="relative flex items-center glass rounded-xl overflow-hidden shadow-lg border border-[rgba(255,255,255,0.1)] focus-within:border-[rgba(255,255,255,0.3)] transition-colors">
                                <input
                                    className="w-full bg-transparent text-[var(--color-surface)] placeholder-[var(--color-surface-dim)] px-5 py-4 focus:outline-none text-sm sm:text-base font-medium"
                                    placeholder="Refine results? (e.g. 'find something cheaper', 'needs to be wireless')"
                                    value={followUpQuery}
                                    onChange={(e) => setFollowUpQuery(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !followUpQuery.trim()}
                                    className="flex items-center gap-2 px-6 py-3 mr-2 my-1 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg disabled:opacity-40 transition-all text-sm backdrop-blur-md"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            Update
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Start Over */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => { setResults(null); setQuery(""); setMessages([]); setFollowUpQuery(""); }}
                            className="text-sm font-medium text-[var(--color-surface-muted)] hover:text-white transition-colors flex items-center gap-1.5 mx-auto"
                        >
                            <ArrowRight className="w-4 h-4" /> Start a completely new search
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
