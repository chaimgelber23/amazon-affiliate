'use client';

import { ExternalLink, Tag, Clock } from 'lucide-react';
import type { ExternalDeal } from '@/lib/types';

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
    return (
        <div className="card flex flex-col relative overflow-hidden group">
            {isNew && (
                <span className="absolute top-3 right-3 z-10 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[rgba(0,240,255,0.15)] text-[var(--color-accent)] border border-[rgba(0,240,255,0.3)] animate-pulse">
                    New
                </span>
            )}

            {/* Product image */}
            <div className="w-full aspect-square bg-[var(--color-bg-elevated)] overflow-hidden rounded-t-2xl flex items-center justify-center">
                {deal.image_url ? (
                    <img
                        src={deal.image_url}
                        alt={deal.title}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-[var(--color-amazon)]/10 flex items-center justify-center">
                        <Tag className="w-8 h-8 text-[var(--color-amazon)]" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Title */}
                <h3 className="text-sm font-semibold text-[var(--color-surface)] leading-snug line-clamp-3">
                    {deal.title}
                </h3>

                {/* Price + time */}
                <div className="flex items-center gap-3 mt-auto">
                    {deal.price && (
                        <span className="text-[var(--color-amazon)] font-bold text-base">
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
                    className="btn-amazon flex items-center justify-center gap-2 w-full text-sm py-2.5"
                >
                    Get Deal on Amazon
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    );
}
