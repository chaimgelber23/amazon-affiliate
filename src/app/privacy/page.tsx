import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "PureFind privacy policy — we don't collect personal data.",
    alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto prose prose-slate">
                <h1 className="text-3xl font-black text-[var(--color-surface)] mb-8">Privacy Policy</h1>
                <p className="text-xs text-[var(--color-surface-dim)] mb-8">Last updated: April 15, 2026</p>

                <div className="space-y-8 text-sm text-[var(--color-surface-muted)] leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">What We Collect</h2>
                        <p>
                            PureFind does <strong>not</strong> collect personal information. We do not require accounts,
                            logins, emails, or any form of registration.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Search Queries</h2>
                        <p>
                            When you search for a product, your query is sent to our server to generate AI recommendations.
                            We log anonymized search queries (with hashed, non-reversible IP addresses) solely to improve
                            our search quality. We cannot identify you from this data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Cookies &amp; Local Storage</h2>
                        <p>
                            PureFind uses browser session storage to cache your recent search results for faster repeat
                            searches. This data stays on your device and is cleared when you close your browser tab.
                            We do not use tracking cookies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Amazon Affiliate Links</h2>
                        <p>
                            Product links include our Amazon Associates affiliate tag. When you click a link and make a
                            purchase on Amazon, we earn a small commission (1-4.5%) at no extra cost to you. Amazon may
                            set its own cookies when you visit their site — that is governed by
                            Amazon&apos;s privacy policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Chrome Extension</h2>
                        <p>
                            The PureFind Chrome extension operates entirely on your device. It sends your search queries
                            to our API to fetch product recommendations. It does not access your browsing history,
                            read website content, or collect any user data. All extension code runs locally from
                            the installed package.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Third-Party Services</h2>
                        <p>
                            We use Google Gemini AI to generate product recommendations and Amazon.com to verify
                            product details. Your search queries are processed by these services. We do not share
                            any personal information with them because we do not collect any.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Contact</h2>
                        <p>
                            Questions about this policy? Reach us at{" "}
                            <a href="mailto:support@purefind.com" className="text-[var(--color-accent)] hover:underline">
                                support@purefind.com
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
