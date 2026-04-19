import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "PureFind privacy policy — what we collect, what we don't, and how the Chrome extension works.",
    alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto prose prose-slate">
                <h1 className="text-3xl font-black text-[var(--color-surface)] mb-8">Privacy Policy</h1>
                <p className="text-xs text-[var(--color-surface-dim)] mb-8">Last updated: April 17, 2026</p>

                <div className="space-y-8 text-sm text-[var(--color-surface-muted)] leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">What We Collect</h2>
                        <p>
                            PureFind does <strong>not</strong> require accounts, logins, emails, or any form of
                            registration. We do collect and store the following for service quality and abuse
                            prevention:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Search queries</strong> you submit (the text of what you searched)</li>
                            <li>
                                A <strong>non-reversible hash of your IP address</strong> — used only for per-IP
                                rate limiting and to group repeated abuse patterns. The raw IP is never written to
                                our database.
                            </li>
                            <li>
                                Request metadata: result count, whether the result was verified against Amazon's
                                Product Advertising API, and the duration of the request.
                            </li>
                        </ul>
                        <p className="mt-2">
                            We cannot identify you from this data. We do not profile users across sessions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Amazon Product Data</h2>
                        <p>
                            Product details (titles, prices, images, ratings, review counts) are fetched from
                            Amazon via the official <strong>Amazon Product Advertising API 5.0</strong> under
                            our Associates account. We do <strong>not</strong> scrape Amazon pages or extract
                            data from the Amazon website. PA-API responses are cached in our database for up
                            to 24 hours to reduce load and improve response time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Cookies &amp; Local Storage</h2>
                        <p>
                            PureFind uses browser session storage to cache your recent search results for faster
                            repeat searches. This data stays on your device and is cleared when you close your
                            browser tab. We do not use tracking cookies, pixels, or third-party analytics.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Amazon Affiliate Links</h2>
                        <p>
                            Product links include our Amazon Associates tracking tag. When you click a link and
                            make a purchase on Amazon, we earn a commission at no extra cost to you. Rates
                            vary by category (1-10%) per Amazon's published rate card:{" "}
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

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Chrome Extension</h2>
                        <p>
                            The PureFind Chrome extension runs on <code>https://www.amazon.com/s*</code>{" "}
                            (Amazon search result pages) only. When installed, it:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>
                                Injects a floating PureFind button onto Amazon search pages. Clicking the button
                                opens an in-page iframe with our search widget.
                            </li>
                            <li>
                                The search widget sends queries <em>you explicitly type</em> to our API at{" "}
                                <code>purefind.vercel.app/api/search</code>. It does <strong>not</strong>{" "}
                                automatically read the Amazon search input field, browsing history, or any
                                other page content.
                            </li>
                            <li>
                                Uses <code>chrome.storage.local</code> to remember your last query and results
                                between popup openings. This data never leaves your device.
                            </li>
                            <li>
                                When you are browsing on Amazon and click a recommended product, the extension
                                opens the link <strong>without</strong> our affiliate tag to avoid a
                                self-referral — affiliate commissions apply only when you click from our
                                website or from the extension toolbar popup on a non-Amazon tab.
                            </li>
                        </ul>
                        <p className="mt-2">
                            The extension does <strong>not</strong> access or read the content of other
                            websites, tabs, or your browsing history. Permissions are scoped to the Amazon
                            search path only.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Third-Party Services</h2>
                        <p>
                            We use <strong>Google Gemini</strong> (via the official AI SDK) to generate product
                            recommendations from your search query. Your query is transmitted to Google for
                            processing under Google&apos;s API terms. We also use <strong>Amazon PA-API</strong>{" "}
                            to retrieve product data. We do not share any personal information with these
                            services because we do not collect any.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-[var(--color-surface)] mb-3">Data Requests &amp; Contact</h2>
                        <p>
                            We don&apos;t store data tied to an identity, so most data requests (access, deletion)
                            are trivially satisfied — there&apos;s nothing linked to you to begin with. For any
                            other questions or requests related to this policy, contact us at{" "}
                            <a href="mailto:support@purefind.com" className="text-[var(--color-accent)] hover:underline">
                                support@purefind.com
                            </a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
