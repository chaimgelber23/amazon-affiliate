"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Search } from "lucide-react";
import { SearchBox } from "./SearchBox";

const EXAMPLE_RUNS = [
    {
        id: "bookshelf",
        label: "Bookshelf",
        query: "best budget-friendly bookshelf for a small apartment",
        searchPlaceholder: "budget bookshelf",
        summary: "Example shortlist with photos, fields, and trade-offs",
        refinement: "small room, easy to move",
        refinementResult: "Same list, better fit",
        picks: [
            {
                rank: 1,
                visual: "bookcase",
                chip: "Top fit",
                chipClass: "bg-[var(--color-accent-muted)] text-[var(--color-plum)] border-[var(--color-plum)]/20",
                title: "Tall bookcase with back brace",
                why: "Best balance of storage, footprint, and stability for daily use.",
                catch: "Needs careful anchoring if kids can reach it.",
            },
            {
                rank: 2,
                visual: "cubes",
                chip: "Flexible",
                chipClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
                title: "Stackable cube organizer",
                why: "Easy to reconfigure for books, baskets, and odd corners.",
                catch: "Can feel less solid when stacked too high.",
            },
            {
                rank: 3,
                visual: "ladder",
                chip: "Small room",
                chipClass: "bg-amber-50 text-amber-800 border-amber-200",
                title: "Slim ladder shelf",
                why: "Looks lighter in the room and saves floor space.",
                catch: "Holds fewer heavy hardcovers.",
            },
        ],
    },
    {
        id: "espresso",
        label: "Espresso",
        query: "quiet espresso machine for a beginner kitchen",
        searchPlaceholder: "beginner espresso maker",
        summary: "8 ranked picks, sorted by effort and upkeep",
        refinement: "low mess, easy milk drinks",
        refinementResult: "Filters toward simpler routines",
        picks: [
            {
                rank: 1,
                chip: "Starter",
                chipClass: "bg-[var(--color-accent-muted)] text-[var(--color-plum)] border-[var(--color-plum)]/20",
                title: "Compact semi-automatic machine",
                why: "Lets a beginner learn real espresso without a huge setup.",
                catch: "Takes practice before shots taste consistent.",
            },
            {
                rank: 2,
                chip: "Easy",
                chipClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
                title: "Capsule-style starter machine",
                why: "Fast, quiet, and hard to mess up on busy mornings.",
                catch: "Less control over taste and more recurring waste.",
            },
            {
                rank: 3,
                chip: "Upgrade",
                chipClass: "bg-amber-50 text-amber-800 border-amber-200",
                title: "All-in-one grinder model",
                why: "Cleaner counter setup if you want fresher coffee.",
                catch: "More parts to clean and troubleshoot.",
            },
        ],
    },
    {
        id: "stroller",
        label: "Stroller",
        query: "lightweight stroller for city errands and subway stairs",
        searchPlaceholder: "city stroller",
        summary: "10 ranked picks, balanced for real city use",
        refinement: "one-hand fold, small trunk",
        refinementResult: "Narrows to easier daily carry",
        picks: [
            {
                rank: 1,
                chip: "City pick",
                chipClass: "bg-[var(--color-accent-muted)] text-[var(--color-plum)] border-[var(--color-plum)]/20",
                title: "One-hand fold umbrella stroller",
                why: "Light enough to carry while still feeling stable outside.",
                catch: "Storage basket is usually modest.",
            },
            {
                rank: 2,
                chip: "Travel",
                chipClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
                title: "Compact travel stroller",
                why: "Folds smaller for cars, hallways, and crowded transit.",
                catch: "Tiny wheels can struggle on cracked sidewalks.",
            },
            {
                rank: 3,
                chip: "Comfort",
                chipClass: "bg-amber-50 text-amber-800 border-amber-200",
                title: "Full-feature city stroller",
                why: "Better shade, recline, and storage for long outings.",
                catch: "Heavier when stairs are part of the routine.",
            },
        ],
    },
    {
        id: "headphones",
        label: "Headphones",
        query: "noise-cancelling headphones for studying in a loud house",
        searchPlaceholder: "study headphones",
        summary: "7 ranked picks, compared by quiet and comfort",
        refinement: "glasses friendly, long sessions",
        refinementResult: "Prioritizes comfort over specs",
        picks: [
            {
                rank: 1,
                chip: "Focus",
                chipClass: "bg-[var(--color-accent-muted)] text-[var(--color-plum)] border-[var(--color-plum)]/20",
                title: "Over-ear quiet-study set",
                why: "Best blend of isolation, comfort, and steady battery life.",
                catch: "Bulkier to carry between rooms or classes.",
            },
            {
                rank: 2,
                chip: "Light",
                chipClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
                title: "Lightweight wireless pair",
                why: "Easier to wear for long sessions without pressure.",
                catch: "Noise cancelling is usually less powerful.",
            },
            {
                rank: 3,
                chip: "Simple",
                chipClass: "bg-amber-50 text-amber-800 border-amber-200",
                title: "Wired backup set",
                why: "Reliable for a desk where charging is annoying.",
                catch: "No active noise cancelling.",
            },
        ],
    },
];

const SEARCH_PLACEHOLDERS = EXAMPLE_RUNS.map((run) => run.searchPlaceholder);

function DemoProductImage() {
    return (
        <div className="h-16 w-16 flex-shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] shadow-sm" aria-hidden="true" />
    );
}

function DemoShortlist() {
    const example = EXAMPLE_RUNS[0];

    return (
        <aside className="relative w-full min-w-0 max-w-full text-left animate-fade-in-up stagger-2" style={{ opacity: 0 }} aria-label="Example ProductFindAI shortlist">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-plum)]">
                    Example output
                </span>
                <span className="text-[11px] font-semibold text-[var(--color-ink-dim)]">
                    Example only
                </span>
            </div>

            <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card-solid)] shadow-[0_34px_90px_-32px_rgba(26,15,8,0.35),0_12px_34px_-22px_rgba(91,33,182,0.24)]">
                <div className="border-b border-[var(--color-border)] bg-[var(--color-ink)] px-5 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                            <Search size={16} strokeWidth={2.5} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate font-mono text-[12px] text-white/55">{example.query}</p>
                            <p className="truncate text-sm font-bold text-white">{example.summary}</p>
                        </div>
                    </div>
                </div>

                <ul>
                    {example.picks.map((pick, index) => (
                        <li
                            key={pick.rank}
                            className={`grid grid-cols-[auto_minmax(0,1fr)] gap-3.5 px-4 py-3.5 sm:px-5 ${index > 0 ? "border-t border-[var(--color-border)]" : ""}`}
                        >
                            <div className="relative">
                                <DemoProductImage />
                                <span className="font-mono tnum absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-lg border border-white bg-[var(--color-ink)] text-[11px] font-bold text-white shadow-sm" aria-hidden="true">
                                    {pick.rank}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-display text-[15px] font-bold tracking-normal text-[var(--color-ink)]">
                                        {pick.title}
                                    </span>
                                    <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${pick.chipClass}`}>
                                        {pick.chip}
                                    </span>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    {["Image", "Price", "Rating", "Reviews"].map((field) => (
                                        <span key={field} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-warm)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-dim)]">
                                            {field}
                                        </span>
                                    ))}
                                    <span className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-card-solid)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-muted)]">
                                        View on Amazon
                                    </span>
                                </div>
                                <p className="mt-2 text-[12.5px] leading-snug text-[var(--color-ink-muted)]">
                                    <span className="mr-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--color-plum)]">Why</span>
                                    {pick.why}
                                </p>
                                <p className="mt-1 text-[12.5px] leading-snug text-[var(--color-ink-muted)]">
                                    <span className="mr-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--color-rose)]">Catch</span>
                                    {pick.catch}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="flex min-w-0 flex-wrap items-center gap-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg-warm)]/55 px-5 py-3.5 sm:px-6">
                    <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-card-solid)] px-3.5 py-1.5 font-mono text-[12px] text-[var(--color-ink-muted)]">
                        <span className="truncate">{example.refinement}</span>
                        <span className="h-3.5 w-px animate-pulse bg-[var(--color-plum)]" aria-hidden="true" />
                    </span>
                    <ArrowRight size={13} strokeWidth={2.5} className="text-[var(--color-ink-dim)]" aria-hidden="true" />
                    <span className="text-[12px] font-semibold text-[var(--color-ink-muted)]">
                        {example.refinementResult}
                    </span>
                </div>
            </div>
        </aside>
    );
}

export function HeroShowcase() {
    const [searchActive, setSearchActive] = useState(false);
    const [activePlaceholder, setActivePlaceholder] = useState(0);
    const placeholder = SEARCH_PLACEHOLDERS[activePlaceholder];

    useEffect(() => {
        if (searchActive) return;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) return;

        const interval = window.setInterval(() => {
            setActivePlaceholder((current) => (current + 1) % SEARCH_PLACEHOLDERS.length);
        }, 4200);

        return () => window.clearInterval(interval);
    }, [searchActive]);

    return (
        <div className={searchActive ? "mx-auto max-w-3xl" : "grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(370px,0.96fr)] lg:gap-12"}>
            <div className={searchActive ? "min-w-0 text-center" : "min-w-0 text-center lg:text-left"}>
                <h1 className="font-display mb-6 text-[34px] font-extrabold leading-[1.03] tracking-normal text-[var(--color-ink)] min-[380px]:text-[38px] sm:text-5xl lg:text-[62px]">
                    The Amazon shortlist you wish already existed.
                </h1>

                <p className="mx-auto mb-7 max-w-2xl text-lg leading-snug text-[var(--color-ink-muted)] sm:text-xl lg:mx-0 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
                    Tell ProductFindAI what you need. It compares the category and returns about 7 ranked picks with the catch on each.
                </p>

                <p className="mx-auto mb-3 max-w-xl text-[11px] leading-relaxed text-[var(--color-ink-dim)] lg:mx-0">
                    As an Amazon Associate I earn from qualifying purchases.
                </p>

                <SearchBox
                    onActiveChange={setSearchActive}
                    placeholder={`Try "${placeholder}"`}
                />

                {!searchActive && (
                    <>
                        <p className="mx-auto mt-5 max-w-xl text-[13px] font-semibold leading-snug text-[var(--color-ink-muted)] lg:mx-0 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
                            <span className="text-[var(--color-plum)]">We do the research for you.</span>{" "}
                            Search once. Add details like &quot;renter friendly&quot; or &quot;small room&quot; afterward. ProductFindAI keeps the first search in mind and updates the same list.
                        </p>

                        <div className="mt-7 hidden flex-col items-center gap-x-6 gap-y-3 text-sm min-[380px]:flex sm:flex-row lg:justify-start animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
                            <Link
                                href="/privacy#amazon-affiliate-links"
                                className="text-[12px] text-[var(--color-ink-dim)] underline-offset-2 transition-colors hover:text-[var(--color-ink-muted)] hover:underline"
                            >
                                How affiliate links work
                            </Link>
                        </div>
                    </>
                )}
            </div>

            {!searchActive && <DemoShortlist />}

            {!searchActive && (
                <div className="col-span-full flex justify-center animate-fade-in stagger-4" style={{ opacity: 0 }}>
                    <a
                        href="#how-it-works"
                        className="inline-flex flex-col items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)] transition-colors hover:text-[var(--color-plum)]"
                    >
                        How it works
                        <ArrowDown size={15} strokeWidth={2.5} className="animate-bounce" aria-hidden="true" />
                    </a>
                </div>
            )}
        </div>
    );
}
