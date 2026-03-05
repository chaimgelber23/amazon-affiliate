'use client';

import { ExternalLink, Tag, Clock } from 'lucide-react';
import type { ExternalDeal } from '@/lib/types';

const SOURCE_COLORS: Record<string, string> = {
    dansdeals: 'text-[#00F0FF] border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.08)]',
    pzdeals: 'text-[#B200FF] border-[rgba(178,0,255,0.3)] bg-[rgba(178,0,255,0.08)]',
    simplexdeals: 'text-[#FF00A0] border-[rgba(255,0,160,0.3)] bg-[rgba(255,0,160,0.08)]',
};

const SOURCE_LABELS: Record<string, string> = {
    dansdeals: 'DansDeals',
    pzdeals: 'PZDeals',
    simplexdeals: 'SimplexDeals',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

interface DealCardProps {
    deal: ExternalDeal;
    isNew?: boolean;
}

export function DealCard({ deal, isNew }: DealCardProps) {
    const sourceColor = SOURCE_COLORS[deal.source] ?? 'text-[var(--color-surface-muted)] border-[var(--color-border)] bg-transparent';
    const sourceName = SOURCE_LABELS[deal.source] ?? deal.source;

    return (
        <div className="card p-5 flex flex-col gap-3 relative overflow-hidden group">
            {isNew && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[rgba(0,240,255,0.15)] text-[var(--color-accent)] border border-[rgba(0,240,255,0.3)] animate-pulse">
                    New
                </span>
            )}

            {/* Source badge */}
            <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${sourceColor}`}>
                    {sourceName}
                </span>
                {deal.sources.length > 1 && (
                    <span className="text-[11px] text-[var(--color-surface-dim)]">
                        +{deal.sources.length - 1} more site{deal.sources.length > 2 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold text-[var(--color-surface)] leading-snug line-clamp-3">
                {deal.title}
            </h3>

            {/* Price + time */}
            <div className="flex items-center gap-3 mt-auto pt-1">
                {deal.price && (
                    <span className="flex items-center gap-1 text-[var(--color-amazon)] font-bold text-base">
                        <Tag className="w-3.5 h-3.5" />
                        {deal.price}
                    </span>
                )}
                <span className="flex items-center gap-1 text-[var(--color-surface-dim)] text-xs ml-auto">
                    <Clock className="w-3 h-3" />
                    {timeAgo(deal.posted_at)}
                </span>
            </div>

            {/* CTA */}
            <a
                href={deal.amazon_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-amazon flex items-center justify-center gap-2 w-full text-sm py-2.5 mt-1"
            >
                Get Deal on Amazon
                <ExternalLink className="w-3.5 h-3.5" />
            </a>
        </div>
    );
}
