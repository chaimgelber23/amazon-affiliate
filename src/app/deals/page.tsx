'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DealCard } from '@/components/DealCard';
import type { ExternalDeal } from '@/lib/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function getDayKey(deal: ExternalDeal): string {
    return new Date(deal.posted_at).toDateString();
}

function dayLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ── component ─────────────────────────────────────────────────────────────────

export default function DealsPage() {
    const [deals, setDeals]         = useState<ExternalDeal[]>([]);
    const [newAsins, setNewAsins]   = useState<Set<string>>(new Set());
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    const [fallback, setFallback]   = useState(false);
    const [query, setQuery]         = useState('');
    const [openDays, setOpenDays]   = useState<Set<string>>(new Set());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseRef = useRef<any>(null);

    // ── initial load ────────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res  = await fetch('/api/deals');
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                const all: ExternalDeal[] = data.deals ?? [];
                setDeals(all);
                setFallback(data.fallback ?? false);
                // Open the most recent day by default
                if (all.length > 0) setOpenDays(new Set([getDayKey(all[0])]));
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load deals');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // ── realtime ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;

        const client = createClient(url, key);
        supabaseRef.current = client;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channel: any = client
            .channel('external_deals_live')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'external_deals' }, (payload: any) => {
                const d = payload.new as ExternalDeal;
                setDeals(prev => [d, ...prev]);
                setNewAsins(prev => new Set(prev).add(d.asin));
                // Open today's section if it isn't already
                setOpenDays(prev => new Set(prev).add(getDayKey(d)));
                setTimeout(() => setNewAsins(prev => { const s = new Set(prev); s.delete(d.asin); return s; }), 30000);
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'external_deals' }, (payload: any) => {
                const updated = payload.new as ExternalDeal;
                if (updated.status === 'expired') setDeals(prev => prev.filter(d => d.asin !== updated.asin));
            })
            .subscribe();

        return () => { client.removeChannel(channel); };
    }, []);

    // ── derived state ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        if (!query.trim()) return deals;
        const q = query.toLowerCase();
        return deals.filter(d => d.title.toLowerCase().includes(q));
    }, [deals, query]);

    const grouped = useMemo(() => {
        const g: Record<string, ExternalDeal[]> = {};
        for (const d of filtered) {
            const k = getDayKey(d);
            (g[k] ??= []).push(d);
        }
        return g;
    }, [filtered]);

    const dayKeys = useMemo(() =>
        Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
        [grouped]
    );

    const toggleDay = (k: string) =>
        setOpenDays(prev => {
            const s = new Set(prev);
            s.has(k) ? s.delete(k) : s.add(k);
            return s;
        });

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <main className="min-h-screen pb-20 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">

                {/* Page header */}
                <div className="pt-10 pb-8 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-accent)] mb-3">
                        Updated every minute
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-surface)] mb-3">
                        Amazon Deals
                    </h1>
                    <p className="text-sm text-[var(--color-surface-muted)] max-w-sm mx-auto">
                        {fallback
                            ? 'Showing the most recent deals — new ones are on their way.'
                            : 'The best Amazon deals, updated in real time.'}
                    </p>
                </div>

                {/* ── Search bar ── */}
                <div className="mb-10 max-w-xl mx-auto">
                    <div className="flex items-center bg-white border-2 border-[var(--color-border)] focus-within:border-[var(--color-accent)] rounded-2xl overflow-hidden transition-colors shadow-sm">
                        <input
                            className="w-full bg-transparent px-5 py-4 text-sm text-[var(--color-surface)] placeholder-[var(--color-surface-dim)] focus:outline-none"
                            placeholder="Search deals — headphones, kitchen, laptop..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="px-5 py-4 text-xs font-semibold text-[var(--color-surface-dim)] hover:text-[var(--color-accent)] transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    {query && (
                        <p className="text-xs text-[var(--color-surface-dim)] mt-2 text-center">
                            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                        </p>
                    )}
                </div>

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className="rounded-2xl overflow-hidden animate-pulse border border-[var(--color-border)] bg-white">
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
                {error && !loading && (
                    <div className="p-5 bg-red-50 border border-red-200 rounded-xl text-center max-w-md mx-auto">
                        <p className="text-red-600 text-sm font-semibold">Failed to load deals</p>
                        <p className="text-xs text-red-400 mt-1">{error}</p>
                    </div>
                )}

                {/* Empty state (no deals at all) */}
                {!loading && !error && deals.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-[var(--color-surface-muted)] text-sm">No deals yet — check back soon.</p>
                        <p className="text-[var(--color-surface-dim)] text-xs mt-1">Deals sync every minute.</p>
                    </div>
                )}

                {/* No search results */}
                {!loading && query && filtered.length === 0 && deals.length > 0 && (
                    <div className="text-center py-16">
                        <p className="text-[var(--color-surface-muted)] text-sm">
                            No deals matching &ldquo;{query}&rdquo;
                        </p>
                        <button
                            onClick={() => setQuery('')}
                            className="text-[var(--color-accent)] text-xs mt-2 hover:underline cursor-pointer"
                        >
                            Clear search
                        </button>
                    </div>
                )}

                {/* ── Day sections ── */}
                {!loading && dayKeys.length > 0 && (
                    <div className="space-y-8">
                        {dayKeys.map((dayKey) => {
                            const label    = dayLabel(dayKey);
                            const dayDeals = grouped[dayKey];
                            const isOpen   = openDays.has(dayKey);
                            const isToday  = label === 'Today';
                            const isPast   = !isToday && label !== 'Yesterday';

                            return (
                                <section key={dayKey}>
                                    {/* Day header — clickable to expand/collapse */}
                                    <button
                                        onClick={() => toggleDay(dayKey)}
                                        className="w-full flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-5 group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-lg font-bold text-[var(--color-surface)]">
                                                {label}
                                            </h2>
                                            {isToday && (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                                                    Live
                                                </span>
                                            )}
                                            {!isToday && (
                                                <span className="text-[10px] font-semibold text-[var(--color-surface-dim)] bg-[var(--color-bg-elevated)] px-2 py-0.5 rounded-full">
                                                    {isPast ? 'Previous deals' : 'Yesterday'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-[var(--color-surface-dim)]">
                                                {dayDeals.length} deal{dayDeals.length !== 1 ? 's' : ''}
                                            </span>
                                            <span className="text-lg font-light text-[var(--color-surface-dim)] group-hover:text-[var(--color-surface)] transition-colors">
                                                {isOpen ? '−' : '+'}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Deal grid — hidden when collapsed */}
                                    {isOpen && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-fade-in">
                                            {dayDeals.map(deal => (
                                                <DealCard
                                                    key={deal.asin}
                                                    deal={deal}
                                                    isNew={newAsins.has(deal.asin)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
