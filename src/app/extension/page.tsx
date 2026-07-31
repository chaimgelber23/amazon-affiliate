import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Chrome extension paused",
    description:
        "The ProductFindAI Chrome extension prototype is paused and must not be installed, used, or distributed.",
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
                        The Chrome extension is paused.
                    </h1>

                    <p className="text-lg sm:text-xl text-[var(--color-surface-muted)] leading-relaxed max-w-2xl mb-10">
                        Amazon Associates approval for the ProductFindAI website does not approve a browser extension. Do not install, use, or distribute this prototype. Use the website for ProductFindAI searches.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mb-14">
                        <Link href="/" className="btn-primary text-base px-8 py-4 shadow-md inline-flex items-center gap-2">
                            Search on ProductFindAI
                        </Link>
                    </div>

                    <div className="card p-7 sm:p-9 mb-10">
                        <h2 className="font-display text-2xl font-bold text-[var(--color-surface)] mb-6 tracking-tight">
                            What the design prototype covers
                        </h2>

                        <ul className="space-y-3 text-sm text-[var(--color-surface-muted)] leading-relaxed">
                            <li>A toolbar search and an optional Amazon search-page widget.</li>
                            <li>Mark prices, ratings, and product details only when they come from Amazon&apos;s official product service.</li>
                            <li>Show when official product information was checked and display Amazon&apos;s required notices.</li>
                            <li>Use Amazon links without affiliate tracking. Removing affiliate tracking does not remove Amazon&apos;s extension restriction.</li>
                            <li>Add only the ProductFindAI panel. It does not read Amazon page content, searches, form fields, or cookies.</li>
                        </ul>
                    </div>

                    <div className="card p-7 sm:p-9 mb-10">
                        <h2 className="font-display text-2xl font-bold text-[var(--color-surface)] mb-4 tracking-tight">
                            Written approval is required before any installation
                        </h2>
                        <p className="text-sm text-[var(--color-surface-muted)] leading-relaxed">
                            A future release requires written Amazon approval for the extension, a new policy review under the approved terms, and Chrome Web Store review. Until all 3 are complete, the prototype remains paused.
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
