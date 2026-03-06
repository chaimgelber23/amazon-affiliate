'use client';

import type { ExternalDeal } from '@/lib/types';

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

/** Extract discount string from deal title, e.g. "60% off" or "Save $30" */
function extractDiscount(title: string): string | undefined {
    const pct = title.match(/(\d+)%\s*off/i);
    if (pct) return `${pct[1]}% off`;
    const save = title.match(/save\s+\$?([\d,]+(?:\.\d{2})?)/i);
    if (save) return `Save $${save[1]}`;
    return undefined;
}

const SOURCE_LABELS: Record<string, string> = {
    dansdeals:     'DansDeals',
    pzdeals:       'PZDeals',
    simplexdeals:  'SimplexDeals',
    savecrazydeals:'SaveCrazyDeals',
    kesefdeals:    'KesefDeals',
    stundeals:     'StunDeals',
};

interface DealCardProps {
    deal: ExternalDeal;
    isNew?: boolean;
}

export function DealCard({ deal, isNew }: DealCardProps) {
    const isExpired = deal.status === 'expired';
    const discount  = extractDiscount(deal.title);
    const sourceName = SOURCE_LABELS[deal.source] ?? deal.source;

    return (
        <div className={`bg-white border border-[var(--color-border)] rounded-2xl flex flex-col relative overflow-hidden group product-card cursor-pointer${isExpired ? ' opacity-60' : ''}`}>

            {/* New badge — top right */}
            {isNew && !isExpired && (
                <span className="absolute top-2.5 right-2.5 z-10 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-50 text-[var(--color-accent)] border border-indigo-200 animate-pulse">
                    New
                </span>
            )}

            {/* Discount badge — top left */}
            {discount && !isExpired && (
                <span className="absolute top-2.5 left-2.5 z-10 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    {discount}
                </span>
            )}

            {/* Product image */}
            <div className="w-full aspect-square bg-[var(--color-bg-elevated)] rounded-t-2xl flex items-center justify-center overflow-hidden relative">
                {deal.image_url ? (
                    <img
                        src={deal.image_url}
                        alt={deal.title}
                        className={`w-full h-full object-contain p-3 transition-transform duration-300${isExpired ? ' grayscale' : ' group-hover:scale-105'}`}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]" />
                )}

                {/* Expired overlay */}
                {isExpired && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-red-50 text-red-500 border border-red-200">
                            Expired
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="text-sm font-semibold text-[var(--color-surface)] leading-snug line-clamp-3">
                    {deal.title}
                </h3>

                <div className="flex items-center gap-2 mt-auto">
                    {deal.price && (
                        <span className={`font-bold text-sm${isExpired ? ' line-through text-[var(--color-surface-dim)]' : ' text-[var(--color-amazon)]'}`}>
                            {deal.price}
                        </span>
                    )}
                    <span className="text-[var(--color-surface-dim)] text-xs ml-auto">
                        {timeAgo(deal.posted_at)}
                    </span>
                </div>

                {deal.price && !isExpired && (
                    <p className="text-[10px] text-[var(--color-surface-dim)] -mt-1">
                        Price at time of posting — verify on Amazon
                    </p>
                )}

                {/* Source tag */}
                <p className="text-[10px] text-[var(--color-surface-dim)]">
                    via {sourceName}
                </p>

                {isExpired ? (
                    <div className="flex items-center justify-center w-full text-xs py-2.5 rounded-xl bg-[var(--color-bg-elevated)] text-[var(--color-surface-dim)] font-medium">
                        Deal ended
                    </div>
                ) : (
                    <a
                        href={deal.amazon_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-amazon flex items-center justify-center w-full text-xs py-2.5 cursor-pointer"
                    >
                        Get Deal on Amazon
                    </a>
                )}
            </div>
        </div>
    );
}
