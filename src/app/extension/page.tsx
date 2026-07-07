import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Chrome extension paused",
    description:
        "The ProductFindAI Chrome extension is paused while the website completes Amazon Associates approval.",
    alternates: { canonical: "/extension" },
    robots: {
        index: false,
        follow: false,
    },
};

export default function ExtensionPage() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <section className="relative pt-12 sm:pt-20 pb-24 px-4 sm:px-8">
                <div className="max-w-3xl mx-auto">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-rose)] mb-5 inline-flex items-center gap-2">
                        <span className="w-5 h-px bg-[var(--color-rose)]" aria-hidden="true" />
                        Extension status
                    </p>

                    <h1
                        className="font-display text-4xl sm:text-6xl md:text-7xl font-medium text-[var(--color-ink)] tracking-[-0.035em] leading-[1.0] mb-7"
                        style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 144' }}
                    >
                        The extension is paused.
                    </h1>

                    <p className="text-lg sm:text-xl text-[var(--color-surface-muted)] leading-relaxed max-w-2xl mb-10">
                        ProductFindAI is focused on the website experience while Amazon Associates approval is in progress. You can still search from the homepage and click through to Amazon from there.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mb-14">
                        <Link href="/" className="btn-primary text-base px-8 py-4 shadow-md inline-flex items-center gap-2">
                            Search on ProductFindAI
                        </Link>
                    </div>

                    <div className="card p-7 sm:p-9 mb-10">
                        <h2 className="font-display text-2xl font-bold text-[var(--color-surface)] mb-6 tracking-tight">
                            Why it is paused
                        </h2>

                        <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                            Amazon Associates approval is simplest when the site is a public website with original product guidance and direct user clicks from ProductFindAI to Amazon. The extension may return later only if it fits Amazon&apos;s rules.
                        </p>
                    </div>

                    <div className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                        <p>
                            Full disclosure of what data ProductFindAI collects is on the{" "}
                            <Link href="/privacy#chrome-extension" className="text-[var(--color-accent)] hover:underline font-semibold">
                                privacy page
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
