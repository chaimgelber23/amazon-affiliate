import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Get the Chrome extension",
    description:
        "Install ProductFindAI for Chrome. Search any Amazon page directly through ProductFindAI without leaving the tab.",
    alternates: { canonical: "/extension" },
};

export default function ExtensionPage() {
    return (
        <div className="relative min-h-screen overflow-hidden">

            <section className="relative pt-12 sm:pt-20 pb-24 px-4 sm:px-8">
                <div className="max-w-3xl mx-auto">

                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-rose)] mb-5 inline-flex items-center gap-2">
                        <span className="w-5 h-px bg-[var(--color-rose)]" aria-hidden="true" />
                        For Chrome &amp; Edge
                    </p>

                    <h1
                        className="font-display text-4xl sm:text-6xl md:text-7xl font-medium text-[var(--color-ink)] tracking-[-0.035em] leading-[1.0] mb-7"
                        style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 144' }}
                    >
                        ProductFindAI, on Amazon itself.
                    </h1>

                    <p className="text-lg sm:text-xl text-[var(--color-surface-muted)] leading-relaxed max-w-2xl mb-10">
                        The extension drops a ProductFindAI button onto every Amazon search results page. Click it, type what you actually want, get the pick — without leaving the tab.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mb-14">
                        <a
                            href="/purefind-extension.zip"
                            download
                            className="btn-primary text-base px-8 py-4 shadow-md inline-flex items-center gap-2"
                        >
                            Download the extension
                        </a>
                        <span className="text-sm font-mono uppercase tracking-[0.15em] text-[var(--color-surface-dim)]">
                            v1.0.2 · 12 KB
                        </span>
                    </div>

                    <div className="card p-7 sm:p-9 mb-10">
                        <h2 className="font-display text-2xl font-bold text-[var(--color-surface)] mb-6 tracking-tight">
                            Install in 30 seconds
                        </h2>

                        <ol className="space-y-5">
                            <li className="flex gap-4">
                                <span className="font-mono tnum text-sm font-bold text-[var(--color-accent)] flex-shrink-0 mt-0.5 w-6">01</span>
                                <div>
                                    <p className="text-[15px] font-semibold text-[var(--color-surface)] leading-snug mb-1">
                                        Download and unzip the file above.
                                    </p>
                                    <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                        You&apos;ll get a folder called <span className="font-mono text-[13px] bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded">purefind-extension</span>.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="font-mono tnum text-sm font-bold text-[var(--color-accent)] flex-shrink-0 mt-0.5 w-6">02</span>
                                <div>
                                    <p className="text-[15px] font-semibold text-[var(--color-surface)] leading-snug mb-1">
                                        Open <span className="font-mono text-[13px] bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded">chrome://extensions</span>
                                    </p>
                                    <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                        Toggle <strong>Developer mode</strong> in the top-right corner.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="font-mono tnum text-sm font-bold text-[var(--color-accent)] flex-shrink-0 mt-0.5 w-6">03</span>
                                <div>
                                    <p className="text-[15px] font-semibold text-[var(--color-surface)] leading-snug mb-1">
                                        Click <strong>Load unpacked</strong> and select the folder.
                                    </p>
                                    <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                                        That&apos;s it. The ProductFindAI button appears next time you load an Amazon search results page.
                                    </p>
                                </div>
                            </li>
                        </ol>
                    </div>

                    <div className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                        <p className="mb-3">
                            <strong className="text-[var(--color-surface)]">What it does:</strong>{" "}
                            Adds a single button to Amazon search pages. The extension only activates on{" "}
                            <span className="font-mono text-[13px]">https://www.amazon.com/s*</span>{" "}
                            — it cannot read other tabs, your browsing history, or any page outside Amazon search results.
                        </p>
                        <p>
                            Full disclosure of what data we collect (none, basically) is on the{" "}
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
