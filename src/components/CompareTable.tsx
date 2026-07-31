"use client";

import { buildAffiliateUrl, buildAffiliateSearchUrl } from "@/lib/affiliate";
import {
    orderProductBadges,
    PRODUCT_BADGE_TONE_CLASSES,
    type ProductBadge,
} from "@/lib/product-badges";

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
    unknownConstraints?: string[];
}

function amazonHref(p: Product): string {
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

function ProsConsList({
    items,
    kind,
}: {
    items: readonly string[];
    kind: "pro" | "con";
}) {
    if (items.length === 0) {
        return (
            <p className="break-words text-xs leading-relaxed text-[var(--color-ink-dim)]">
                {kind === "pro"
                    ? "The official listing did not state a verified advantage."
                    : "The official listing did not state a verified drawback."}
            </p>
        );
    }

    const bulletClass =
        kind === "pro"
            ? "bg-emerald-500"
            : "bg-[var(--color-rose)]";

    return (
        <ul className="min-w-0 space-y-2 text-[var(--color-ink-muted)]">
            {items.map((item, index) => (
                <li
                    key={`${item}-${index}`}
                    className="flex min-w-0 items-start gap-2 text-xs leading-relaxed"
                >
                    <span
                        className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${bulletClass}`}
                        aria-hidden="true"
                    />
                    <span className="min-w-0 break-words">{item}</span>
                </li>
            ))}
        </ul>
    );
}

function MobileComparisonCard({
    product,
    onUnselect,
}: {
    product: Product;
    onUnselect: (rank: number) => void;
}) {
    const tier = tierLabel(product.tier);

    return (
        <article
            className="w-full min-w-0 rounded-3xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card-solid)] p-5 shadow-sm"
            aria-labelledby={`mobile-compare-${product.rank}`}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <span className={`rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${tier.tone}`}>
                    #{product.rank} · {tier.label}
                </span>
                <button
                    type="button"
                    onClick={() => onUnselect(product.rank)}
                    aria-label={`Remove ${product.title} from comparison`}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-ink-dim)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-rose-deep)]"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <ProductBadgePills
                badges={product.badges}
                className="mb-4"
            />

            <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
                <ProductImage p={product} />
                <div className="min-w-0">
                    <h4
                        id={`mobile-compare-${product.rank}`}
                        className="font-display line-clamp-4 text-base font-semibold leading-tight text-[var(--color-ink)]"
                    >
                        {product.title}
                    </h4>
                    <p className="mt-3 font-mono text-xl font-semibold text-[var(--color-ink)] tnum">
                        {product.verified && product.priceEstimate && product.fetchedAt
                            ? product.priceEstimate
                            : "See on Amazon"}
                    </p>
                </div>
            </div>

            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-plum)]">
                    Match evidence
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                    {product.whyThisPick}
                </p>
            </div>

            {product.unknownConstraints &&
                product.unknownConstraints.length > 0 && (
                <section
                    className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
                    aria-label={`Unconfirmed requirements for ${product.title}`}
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">
                        Unconfirmed
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-amber-950">
                        {product.unknownConstraints.map((constraint) => (
                            <li key={constraint}>{constraint}</li>
                        ))}
                    </ul>
                    <p className="mt-2 text-xs text-amber-900">
                        Confirm these details on Amazon before buying.
                    </p>
                </section>
            )}

            <div className="mt-4 grid min-w-0 gap-3">
                <section
                    className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
                    aria-label={`Pros for ${product.title}`}
                >
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                        Pros
                    </p>
                    <ProsConsList items={product.pros} kind="pro" />
                </section>
                <section
                    className="min-w-0 rounded-2xl border border-rose-100 bg-rose-50/60 p-4"
                    aria-label={`Cons for ${product.title}`}
                >
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-rose-deep)]">
                        Cons
                    </p>
                    <ProsConsList items={product.cons} kind="con" />
                </section>
            </div>

            <a
                href={amazonHref(product)}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="btn-amazon mt-5 w-full justify-center text-sm"
            >
                {product.verified ? "View on Amazon" : "Search on Amazon"}
            </a>
            <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-dim)]">
                Affiliate link
            </p>
        </article>
    );
}

/**
 * Side-by-side comparison view. The user toggles 2-3 products from the
 * results list into this table to see specs, pros, and cons aligned.
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

    return (
        <div className="my-12 animate-fade-in-up lg:relative lg:left-1/2 lg:w-[calc(100vw-4rem)] lg:max-w-6xl lg:-translate-x-1/2">
            <div className="mb-6 flex min-w-0 items-start justify-between gap-3 px-1">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-rose)] mb-1.5">
                        Side-by-side
                    </p>
                    <h3
                        id="product-comparison-heading"
                        className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)] tracking-tight"
                    >
                        Comparing {cols.length} of your picks
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-dim)]">
                        Based on official Amazon listing fields, not hands-on testing.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="min-h-11 rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-ink-dim)] transition-colors hover:bg-[var(--color-bg-warm)] hover:text-[var(--color-ink)]"
                >
                    Close
                </button>
            </div>

            <div className="grid min-w-0 gap-4 md:hidden">
                {cols.map((product) => (
                    <MobileComparisonCard
                        key={product.rank}
                        product={product}
                        onUnselect={onUnselect}
                    />
                ))}
            </div>

            <div className="hidden min-w-0 overflow-hidden md:block">
                <table className="w-full table-fixed border-separate border-spacing-0">
                    <caption className="sr-only">
                        Side-by-side comparison of {cols.length} selected ProductFindAI results
                    </caption>
                    <thead>
                        <tr>
                            <th
                                scope="col"
                                className="w-24 align-top text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)] lg:w-36"
                            >
                                <span className="sr-only">Attribute</span>
                            </th>
                            {cols.map((p) => {
                                const tl = tierLabel(p.tier);
                                return (
                                    <th
                                        key={p.rank}
                                        scope="col"
                                        className="min-w-0 break-words border border-[var(--color-border)] bg-[var(--color-bg-card-solid)] p-3 text-left align-top first:rounded-tl-2xl last:rounded-tr-2xl lg:p-4"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] rounded-md border ${tl.tone}`}>
                                                #{p.rank} · {tl.label}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onUnselect(p.rank)}
                                                aria-label={`Remove ${p.title} from comparison`}
                                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[var(--color-ink-dim)] transition-colors hover:bg-[var(--color-bg-warm)] hover:text-[var(--color-rose)]"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                        <ProductBadgePills
                                            badges={p.badges}
                                            className="mb-3"
                                        />
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
                                <td key={p.rank} className="min-w-0 break-words border-x border-b border-[var(--color-border)] bg-[var(--color-bg-card-solid)] p-3 align-top lg:p-4">
                                    {p.verified && p.priceEstimate && p.fetchedAt ? (
                                        <span
                                            className="font-mono tnum text-xl font-semibold tracking-tight text-[var(--color-ink)] lg:text-2xl"
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
                                <td key={p.rank} className="min-w-0 break-words border-x border-b border-[var(--color-border)] bg-[var(--color-bg-card-solid)] p-3 align-top lg:p-4">
                                    {p.verified && p.rating > 0 ? (
                                        <div className="flex flex-wrap items-center gap-1.5 text-[var(--color-ink-muted)]" title="Live Amazon rating">
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

                        {/* Official match explanation */}
                        <CompareRow label="Match evidence">
                            {cols.map((p) => (
                                <td key={p.rank} className="min-w-0 break-words border-x border-b border-[var(--color-border)] bg-[var(--color-bg-card-solid)] p-3 align-top leading-relaxed text-[var(--color-ink-muted)] lg:p-4">
                                    {p.whyThisPick}
                                </td>
                            ))}
                        </CompareRow>

                        <CompareRow label="Unconfirmed" tone="amber">
                            {cols.map((p) => (
                                <td
                                    key={p.rank}
                                    className="min-w-0 break-words border-x border-b border-[var(--color-border)] bg-amber-50/40 p-3 align-top lg:p-4"
                                >
                                    {p.unknownConstraints &&
                                    p.unknownConstraints.length > 0 ? (
                                        <>
                                            <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-amber-950">
                                                {p.unknownConstraints.map(
                                                    (constraint) => (
                                                        <li key={constraint}>
                                                            {constraint}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                            <p className="mt-2 text-xs text-amber-900">
                                                Confirm on Amazon before buying.
                                            </p>
                                        </>
                                    ) : (
                                        <span className="text-sm text-[var(--color-ink-dim)]">
                                            None listed
                                        </span>
                                    )}
                                </td>
                            ))}
                        </CompareRow>

                        <CompareRow label="Pros" tone="emerald">
                            {cols.map((p) => (
                                <td key={p.rank} className="min-w-0 break-words border-x border-b border-[var(--color-border)] bg-emerald-50/40 p-3 align-top lg:p-4">
                                    <ProsConsList items={p.pros} kind="pro" />
                                </td>
                            ))}
                        </CompareRow>

                        <CompareRow label="Cons" tone="rose">
                            {cols.map((p) => (
                                <td key={p.rank} className="min-w-0 break-words border-x border-b border-[var(--color-border)] bg-rose-50/40 p-3 align-top lg:p-4">
                                    <ProsConsList items={p.cons} kind="con" />
                                </td>
                            ))}
                        </CompareRow>

                        {/* CTA row */}
                        <tr>
                            <th scope="row" className="w-24 p-3 text-left align-top text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)] lg:w-36 lg:p-4">
                                Open
                            </th>
                            {cols.map((p) => (
                                <td key={p.rank} className="min-w-0 border-x border-b border-[var(--color-border)] bg-[var(--color-bg-card-solid)] p-3 align-top first:rounded-bl-2xl last:rounded-br-2xl lg:p-4">
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
    tone?: "emerald" | "rose" | "amber";
    children: React.ReactNode;
}) {
    const toneClass =
        tone === "emerald" ? "text-emerald-700"
        : tone === "rose" ? "text-[var(--color-rose-deep)]"
        : tone === "amber" ? "text-amber-800"
        : "text-[var(--color-ink-dim)]";
    return (
        <tr>
            <th scope="row" className={`w-24 p-3 text-left align-top text-[10px] font-bold uppercase tracking-[0.18em] lg:w-36 lg:p-4 ${toneClass}`}>
                {label}
            </th>
            {children}
        </tr>
    );
}
