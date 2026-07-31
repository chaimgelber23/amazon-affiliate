import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "ProductFindAI privacy policy - what we collect, what we don't collect, and how Amazon affiliate links work.",
    alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto prose prose-slate">
                <h1 className="text-3xl font-black text-[var(--color-surface)] mb-8">Privacy Policy</h1>
                <p className="text-xs text-[var(--color-surface-dim)] mb-8">Last updated: July 30, 2026</p>

                <div className="space-y-8 text-sm text-[var(--color-surface-muted)] leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">What We Collect</h2>
                        <p>
                            ProductFindAI does <strong>not</strong> require accounts, logins, emails, or any form of
                            registration. We do collect and store the following for service quality and abuse
                            prevention:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Search queries</strong> you submit (the text of what you searched)</li>
                            <li>
                                An <strong>HMAC-pseudonymized version of your IP address</strong>, created with a
                                server-only secret. It is used for rate limiting and to group repeated abuse
                                patterns. The raw IP address is not written to our database.
                            </li>
                            <li>
                                Request metadata: result count, whether the result was verified against Amazon&apos;s
                                official product API, and the duration of the request.
                            </li>
                        </ul>
                        <p className="mt-2">
                            We do not use this operational data to build advertising profiles or track you across
                            unrelated websites.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Amazon Product Data</h2>
                        <p>
                            Product details (titles, available prices, images, and listing features) are fetched from
                            Amazon through the official Creators API under our Associates account. We do{" "}
                            <strong>not</strong> scrape Amazon pages or extract data from the Amazon website.
                            Amazon Program Content is filtered and ranked on ProductFindAI&apos;s server and is not
                            sent to an AI provider. Cached Amazon content is never read after it is 1 hour old.
                            Before an active cache read or write, ProductFindAI synchronously deletes expired
                            rows. If that deletion fails, it bypasses the stored cache and does not write new
                            Amazon content. A database cleanup also runs every 15 minutes and begins deleting
                            cached Amazon content after 30 minutes, leaving headroom before the 1-hour limit.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Cookies &amp; Local Storage</h2>
                        <p>
                            ProductFindAI uses browser session storage to cache non-verified recent search results
                            for faster repeat searches. Search results that include official Amazon product API
                            data are not cached in browser session storage. Session storage stays on your device
                            and is cleared when you close your browser tab. We do not use tracking cookies, pixels,
                            or third-party analytics.
                        </p>
                    </section>

                    <section id="amazon-affiliate-links">
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Amazon Affiliate Links</h2>
                        <p>
                            Product links include our Amazon Associates tracking tag. As an Amazon Associate I
                            earn from qualifying purchases. ProductFindAI may earn a commission when you click a
                            link and make a purchase on Amazon, at no extra cost to you. Current rate information
                            is published by Amazon:{" "}
                            <a
                                href="https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-accent)] hover:underline"
                            >
                                Amazon rates
                            </a>.
                        </p>
                        <p className="mt-2">
                            Amazon may set its own cookies when you visit their site — that is governed by{" "}
                            <a
                                href="https://www.amazon.com/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-accent)] hover:underline"
                            >
                                Amazon&apos;s privacy policy
                            </a>.
                        </p>
                    </section>

                    <section id="chrome-extension">
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Chrome Extension Status</h2>
                        <p>
                            The Chrome extension is a paused prototype. It must not be installed, used, or
                            distributed unless and until Amazon gives express written approval for that use.
                            Approval of the ProductFindAI website for an Amazon Associates account does not
                            approve the extension as a separate application or Site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">AI Query Planning</h2>
                        <p>
                            Depending on server configuration, we send the words in your search query through{" "}
                            <strong>Vercel AI Gateway</strong> or directly to <strong>Google Gemini</strong> to
                            turn the query into a small set of Amazon catalog search phrases. AI does not receive
                            Amazon Program Content and does not choose or
                            rank the final products. Product filtering and ranking use deterministic checks
                            against official Amazon evidence on our server. Query plans may be cached for up to
                            24 hours and are never reused after that point. Do not include sensitive personal
                            information in a product search.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Retention</h2>
                        <p className="mb-2">
                            The database schedules retention cleanup every 15 minutes. Cleanup thresholds start
                            30 minutes before the Amazon cache limit and 1 hour before the other limits below,
                            providing headroom for normal scheduling delay. Expired cache entries are never used.
                            Cleanup is also attempted before new operational logs are written; if it is
                            unavailable, ProductFindAI skips the new log. A database outage can delay physical
                            deletion, and delayed rows are removed by the next successful cleanup.
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Search and error logs: 90-day deletion target.</li>
                            <li>Rate-limit windows: 2-day deletion target.</li>
                            <li>AI-generated query plans: never reused after 24 hours; 24-hour deletion target.</li>
                            <li>
                                Official Amazon Program Content: never read after 1 hour; expired rows are deleted
                                synchronously during active cache operations.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Data Requests &amp; Contact</h2>
                        <p>
                            ProductFindAI does not require an account, so we may not be able to connect a stored
                            operational record to a particular person. For questions or requests related to this
                            policy, contact us at{" "}
                            <a href="mailto:hello@seohandoff.com" className="text-[var(--color-accent)] hover:underline">
                                hello@seohandoff.com
                            </a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
