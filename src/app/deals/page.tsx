import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Zap } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";

export const metadata: Metadata = {
    title: "Deals — Find the Best Prices on Amazon",
    description:
        "Search for any product and PureFind will find the best deals on Amazon right now.",
};

export default function DealsPage() {
    return (
        <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm font-medium mb-6">
                        <Flame className="w-4 h-4 text-[var(--color-danger)]" />
                        <span className="text-[var(--color-danger)]">Hot Deals</span>
                    </div>

                    <h1 className="section-heading" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                        Find the best deals
                    </h1>
                    <p className="mt-4 text-base text-[var(--color-surface-muted)] max-w-xl mx-auto">
                        Search for any product and we&apos;ll find the best-priced options on Amazon right now.
                    </p>
                </div>

                {/* Search Box */}
                <SearchBox />

                {/* Tips */}
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        {
                            tip: "Try searching with a budget",
                            example: '"best laptop under $500"',
                        },
                        {
                            tip: "Be specific about your needs",
                            example: '"air fryer for family of 4"',
                        },
                        {
                            tip: "Compare categories",
                            example: '"standing desk vs sit-stand converter"',
                        },
                    ].map(({ tip, example }) => (
                        <div key={tip} className="card p-4 text-center">
                            <p className="text-sm font-medium mb-1">{tip}</p>
                            <p className="text-xs text-[var(--color-accent)] font-mono">{example}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
