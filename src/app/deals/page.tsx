'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DealCard } from '@/components/DealCard';
import type { ExternalDeal } from '@/lib/types';
import { Zap, RefreshCw, AlertCircle } from 'lucide-react';

export default function DealsPage() {
    const [deals, setDeals] = useState<ExternalDeal[]>([]);
    const [newAsins, setNewAsins] = useState<Set<string>>(new Set());
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
                const res = await fetch('/api/deals');
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
    }, []);

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
                setDeals((prev) => [newDeal, ...prev]);
                setNewAsins((prev) => new Set(prev).add(newDeal.asin));
                setTimeout(() => {
                    setNewAsins((prev) => {
                        const next = new Set(prev);
                        next.delete(newDeal.asin);
                        return next;
                    });
                }, 30000);
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'external_deals' }, (payload: any) => {
                const updated = payload.new as ExternalDeal;
                if (updated.status === 'expired') {
                    setDeals((prev) => prev.filter((d) => d.asin !== updated.asin));
                }
            })
            .subscribe();

        return () => {
            client.removeChannel(channel);
        };
    }, []);

    return (
        <main className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)] mb-4">
                        <Zap className="w-3 h-3" />
                        Live Deals
                    </div>
                    <h1 className="section-heading text-gradient mb-3">Amazon Deals</h1>
                    <p className="text-[var(--color-surface-muted)] text-sm max-w-md mx-auto">
                        The best Amazon deals, updated in real time.
                    </p>
                </div>

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="card overflow-hidden animate-pulse">
                                <div className="aspect-square bg-[var(--color-bg-elevated)]" />
                                <div className="p-4 space-y-2">
                                    <div className="h-3 bg-[var(--color-bg-elevated)] rounded w-full" />
                                    <div className="h-3 bg-[var(--color-bg-elevated)] rounded w-3/4" />
                                    <div className="h-8 bg-[var(--color-bg-elevated)] rounded mt-3" />
                                </div>
                            </div>
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
                        <p className="text-[var(--color-surface-muted)] text-sm">No deals yet — check back soon.</p>
                        <p className="text-[var(--color-surface-dim)] text-xs mt-1">Deals sync every minute.</p>
                    </div>
                )}

                {/* Deal grid */}
                {!loading && deals.length > 0 && (
                    <>
                        <p className="text-[var(--color-surface-dim)] text-xs mb-4 text-center">
                            {deals.length} live deal{deals.length !== 1 ? 's' : ''} · updates automatically
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
