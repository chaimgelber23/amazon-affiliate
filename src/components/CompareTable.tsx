"use client";

import { buildAffiliateUrl, buildAffiliateSearchUrl } from "@/lib/affiliate";

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

function amazonHref(p: Product): string {
    const cleanAsin = typeof p.asin === "string" ? p.asin.trim() : "";
    if (!cleanAsin || cleanAsin === "SEARCH") {
        return buildAffiliateSearchUrl(p.title);
    }
    return buildAffiliateUrl(cleanAsin);
}

function tierLabel(tier?: Product["tier"]): { label: string; tone: string } {
    if (tier === "budget") return { label: "Budget", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (tier === "premium") return { label: "Premium", tone: "text-amber-800 bg-amber-50 border-amber-200" };
    if (tier === "mid") return { label: "Mid-range", tone: "text-[var(--color-plum)] bg-[var(--color-accent-muted)] border-[var(--color-plum)]/20" };
    return { label: "Pick", tone: "text-[var(--color-ink-muted)] bg-[var(--color-bg-warm)] border-[var(--color-border)]" };
}

function ProductImage({ p }: { p: Product }) {
    if (p.imageUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={p.imageUrl}
                alt={p.title}
                width={140}
                height={140}
                className="w-full aspect-square rounded-2xl object-contain bg-white border border-[var(--color-border)] p-3"
                loading="lazy"
            />
        );
    }
    return (
        <div className="w-full aspect-square rounded-2xl bg-[var(--color-bg-warm)] border border-[var(--color-border)] flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-[var(--color-ink-dim)]">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 16l5-5 4 4 3-3 6 6" />
                <circle cx="9" cy="9" r="1.5" />
            </svg>
        </div>
    );
}

/**
 * Side-by-side comparison view. The user toggles 2-3 products from the
 * results list into this table to see specs / pros / cons aligned.
 *
 * Renders nothing for fewer than 2 selected products — caller handles the
 * "select another to compare" empty state.
 */
export function CompareTable({
    products,
    onClose,
    onUnselect,
}: {
    products: Product[];
    onClose: () => void;
    onUnselect: (rank: number) => void;
}) {
    if (products.length < 2) return null;

    // Cap at 3 columns (mobile-readable, fits 4-col grid w/ label column)
    const cols = products.slice(0, 3);

    const maxPros = Math.max(...cols.map((p) => p.pros.length));
    const maxCons = Math.max(...cols.map((p) => p.cons.length));

    return (
        <div className="my-12 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-rose)] mb-1.5">
                        Side-by-side
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)] tracking-tight">
                        Comparing {cols.length} of your picks
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors px-3 py-2"
                >
                    Close
                </button>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full min-w-[640px] border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th className="w-32 sm:w-40 align-top text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)] pb-4">
                                {/* spacer */}
                            </th>
                            {cols.map((p) => {
                                const tl = tierLabel(p.tier);
                                return (
                                    <th
                                        key={p.rank}
                                        className="align-top text-left p-4 bg-[var(--color-bg-card-solid)] border border-[var(--color-border)] first:rounded-tl-2xl last:rounded-tr-2xl"
                                        style={{ minWidth: 220 }}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] rounded-md border ${tl.tone}`}>
                                                #{p.rank} · {tl.label}
                                            </span>
                                            <button
                                                onClick={() => onUnselect(p.rank)}
                                                aria-label={`Remove ${p.title} from comparison`}
                                                className="text-[var(--color-ink-dim)] hover:text-[var(--color-rose)] transition-colors"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                        <ProductImage p={p} />
                                        <h4 className="font-display text-base font-semibold text-[var(--color-ink)] mt-3 leading-tight tracking-tight line-clamp-3">
                                            {p.title}
                                        </h4>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody className="text-sm">
                        {/* Price row: only show a price that comes from Amazon's official
                            product API (verified). Otherwise point to Amazon. */}
                        <CompareRow label="Price">
                            {cols.map((p) => (
                                <td key={p.rank} className="p-4 align-top border-x border-b border-[var(--color-border)] bg-[var(--color-bg-card-solid)]">
                                    {p.verified && p.priceEstimate ? (
                                        <span
                                            className="font-mono tnum text-2xl font-semibold text-[var(--color-ink)] tracking-tight"
                                            title="Live Amazon price"
                                        >
                                            {p.priceEstimate}
                                        </span>
                                    ) : (
                                        <span className="text-sm font-semibold text-[var(--color-ink-dim)]">On Amazon</span>
                                    )}
                                </td>
                            ))}
                        </CompareRow>

                        {/* Rating row: same compliance rule as price. */}
                        <CompareRow label="Rating">
                            {cols.map((p) => (
                                <td key={p.rank} className="p-4 align-top border-x border-b border-[var(--color-border)] bg-[var(--color-bg-card-solid)]">
                                    {p.verified && p.rating > 0 ? (
                                        <div className="flex items-center gap-1.5 text-[var(--color-ink-muted)]" title="Live Amazon rating">
                                            <span className="text-amber-500" aria-hidden="true">★</span>
                                            <span className="font-mono tnum font-semibold text-[var(--color-ink)]">{p.rating.toFixed(1)}</span>
                                            {p.reviewCount ? (
                                                <span className="font-mono tnum text-xs text-[var(--color-ink-dim)]">
                                                    ({p.reviewCount.toLocaleString()})
                                                </span>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <span className="text-sm font-medium text-[var(--color-ink-dim)]">On Amazon</span>
                                    )}
                                </td>
                            ))}
                        </CompareRow>

                        {/* Why this one */}
                        <CompareRow label="Why this one">
                            {cols.map((p) => (
                                <td key={p.rank} className="p-4 align-top border-x border-b border-[var(--color-border)] bg-[var(--color-bg-card-solid)] text-[var(--color-ink-muted)] leading-relaxed">
                                    {p.whyThisPick}
                                </td>
                            ))}
                        </CompareRow>

                        {/* Pros row — list-aligned across columns */}
                        <CompareRow label="Pros" tone="emerald">
                            {cols.map((p) => (
                                <td key={p.rank} className="p-4 align-top border-x border-b border-[var(--color-border)] bg-[var(--color-bg-card-solid)]">
                                    <ul className="space-y-1.5 text-[var(--color-ink-muted)]">
                                        {Array.from({ length: maxPros }).map((_, i) => (
                                            <li key={i} className="flex items-start gap-2 leading-relaxed">
                                                {p.pros[i] ? (
                                                    <>
                                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
                                                        <span>{p.pros[i]}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-[var(--color-ink-dim)]/40">—</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                        </CompareRow>

                        {/* Cons row */}
                        <CompareRow label="Trade-offs" tone="rose">
                            {cols.map((p) => (
                                <td key={p.rank} className="p-4 align-top border-x border-b border-[var(--color-border)] bg-[var(--color-bg-card-solid)]">
                                    <ul className="space-y-1.5 text-[var(--color-ink-muted)]">
                                        {Array.from({ length: maxCons }).map((_, i) => (
                                            <li key={i} className="flex items-start gap-2 leading-relaxed">
                                                {p.cons[i] ? (
                                                    <>
                                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--color-rose)] flex-shrink-0" aria-hidden="true" />
                                                        <span>{p.cons[i]}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-[var(--color-ink-dim)]/40">—</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                        </CompareRow>

                        {/* CTA row */}
                        <tr>
                            <td className="w-32 sm:w-40 align-top p-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">
                                Open
                            </td>
                            {cols.map((p) => (
                                <td key={p.rank} className="p-4 align-top border-x border-b border-[var(--color-border)] bg-[var(--color-bg-card-solid)] first:rounded-bl-2xl last:rounded-br-2xl">
                                    <a
                                        href={amazonHref(p)}
                                        target="_blank"
                                        rel="noopener noreferrer nofollow sponsored"
                                        className="btn-amazon w-full text-sm justify-center"
                                    >
                                        {p.verified ? "View on Amazon" : "Search on Amazon"}
                                    </a>
                                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-dim)] mt-2 text-center">
                                        Affiliate link
                                    </p>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CompareRow({
    label,
    tone,
    children,
}: {
    label: string;
    tone?: "emerald" | "rose";
    children: React.ReactNode;
}) {
    const toneClass =
        tone === "emerald" ? "text-emerald-700"
        : tone === "rose" ? "text-[var(--color-rose-deep)]"
        : "text-[var(--color-ink-dim)]";
    return (
        <tr>
            <td className={`w-32 sm:w-40 align-top p-4 text-[10px] font-bold uppercase tracking-[0.18em] ${toneClass}`}>
                {label}
            </td>
            {children}
        </tr>
    );
}
