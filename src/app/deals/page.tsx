'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DealCard } from '@/components/DealCard';
import type { ExternalDeal } from '@/lib/types';
import { Zap, RefreshCw, AlertCircle } from 'lucide-react';

const SOURCES = [
    { id: 'all', label: 'All Deals' },
    { id: 'dansdeals', label: 'DansDeals' },
    { id: 'pzdeals', label: 'PZDeals' },
    { id: 'simplexdeals', label: 'SimplexDeals' },
];

export default function DealsPage() {
    const [deals, setDeals] = useState<ExternalDeal[]>([]);
    const [newAsins, setNewAsins] = useState<Set<string>>(new Set());
    const [activeSource, setActiveSource] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseRef = useRef<any>(null);

    // Initial fetch
    useEffect(() => {
        async function loadDeals() {
            setLoading(true);
            setError(null);
            try {
                const url = activeSource === 'all'
                    ? '/api/deals'
                    : `/api/deals?source=${activeSource}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setDeals(data.deals ?? []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load deals');
            } finally {
                setLoading(false);
            }
        }
        loadDeals();
    }, [activeSource]);

    // Supabase Realtime subscription for live updates
    useEffect(() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) return;

        const client = createClient(supabaseUrl, supabaseKey);
        supabaseRef.current = client;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channel: any = client
            .channel('external_deals_live')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'external_deals' }, (payload: any) => {
                    const newDeal = payload.new as ExternalDeal;
                    if (activeSource !== 'all' && newDeal.source !== activeSource) return;
                    setDeals((prev) => [newDeal, ...prev]);
                    setNewAsins((prev) => new Set(prev).add(newDeal.asin));
                    setTimeout(() => {
                        setNewAsins((prev) => {
                            const next = new Set(prev);
                            next.delete(newDeal.asin);
                            return next;
                        });
                    }, 30000);
                }
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'external_deals' }, (payload: any) => {
                    const updated = payload.new as ExternalDeal;
                    if (updated.status === 'expired') {
                        setDeals((prev) => prev.filter((d) => d.asin !== updated.asin));
                    }
                }
            )
            .subscribe();

        return () => {
            client.removeChannel(channel);
        };
    }, [activeSource]);

    return (
        <main className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)] mb-4">
                        <Zap className="w-3 h-3" />
                        Live Deals Feed
                    </div>
                    <h1 className="section-heading text-gradient mb-3">Amazon Deals</h1>
                    <p className="text-[var(--color-surface-muted)] text-sm max-w-md mx-auto">
                        Real-time Amazon deals aggregated from top deal sites. Every link earns us a commission.
                    </p>
                </div>

                {/* Source filter tabs */}
                <div className="flex gap-2 mb-8 flex-wrap justify-center">
                    {SOURCES.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSource(s.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                                activeSource === s.id
                                    ? 'bg-[var(--color-accent)] text-black border-[var(--color-accent)]'
                                    : 'glass text-[var(--color-surface-muted)] border-[rgba(255,255,255,0.08)] hover:text-[var(--color-surface)]'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="card h-48 animate-pulse bg-[var(--color-bg-elevated)]" />
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-3 glass rounded-xl p-5 text-[var(--color-danger)] max-w-md mx-auto">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">Failed to load deals</p>
                            <p className="text-xs text-[var(--color-surface-muted)] mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && deals.length === 0 && (
                    <div className="text-center py-20">
                        <RefreshCw className="w-8 h-8 text-[var(--color-surface-dim)] mx-auto mb-3" />
                        <p className="text-[var(--color-surface-muted)] text-sm">
                            No deals yet — check back soon.
                        </p>
                        <p className="text-[var(--color-surface-dim)] text-xs mt-1">
                            Deals sync every minute from deal sites.
                        </p>
                    </div>
                )}

                {/* Deal grid */}
                {!loading && deals.length > 0 && (
                    <>
                        <p className="text-[var(--color-surface-dim)] text-xs mb-4 text-center">
                            {deals.length} live deal{deals.length !== 1 ? 's' : ''} · updates automatically
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {deals.map((deal) => (
                                <DealCard
                                    key={deal.asin}
                                    deal={deal}
                                    isNew={newAsins.has(deal.asin)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
