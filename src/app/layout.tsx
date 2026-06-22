import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ScrollToTopOnLoad } from "@/components/ScrollToTopOnLoad";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://productfindai.com";

// Display headline — clean modern grotesk. Replaces the old Fraunces serif
// per the Pro hero direction; carries weight on the bold gradient hero.
const displayFont = Plus_Jakarta_Sans({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-display",
    weight: ["500", "600", "700", "800"],
});

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-sans",
    weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-mono",
    weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
    themeColor: "#FAF7F2",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
};

export const metadata: Metadata = {
    title: {
        default: "ProductFindAI: we do the Amazon product research, you get about 7 ranked picks",
        template: "%s | ProductFindAI",
    },
    description:
        "We do the product research you would spend an evening on. Type what you want and ProductFindAI digs through the whole category, budget to premium, reads past the keyword-stuffed titles, and ranks about 7 real contenders with the catch on each. No sponsored slots. No seller pays to rank. Refine in place without starting over.",
    metadataBase: new URL(siteUrl),
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "ProductFindAI",
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        siteName: "ProductFindAI",
        title: "We do the product research. You get about 7 ranked picks.",
        description:
            "The afternoon of tab-juggling, done for you. Type what you want and ProductFindAI digs through the whole category, budget to premium, reads past the keyword-stuffed titles, and ranks about 7 real contenders with the catch on each. No sponsored slots. No seller pays to rank. Refine in place without starting over.",
        url: siteUrl,
    },
    twitter: {
        card: "summary_large_image",
        title: "We do the product research. You get about 7 ranked picks.",
        description:
            "Type what you want. We dig through the whole category, budget to premium, read past the keyword-stuffed titles, and rank about 7 real contenders with the catch on each. No sponsored slots. No seller pays to rank. Refine in place without starting over.",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    alternates: {
        canonical: siteUrl,
    },
    icons: {
        icon: "/icons/icon-192.png",
        apple: "/icons/icon-192.png",
    },
    keywords: [
        "amazon product finder",
        "best products amazon",
        "no sponsored results",
        "honest amazon recommendations",
        "amazon product comparison",
        "find products amazon",
    ],
};

function JsonLd() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
                url: siteUrl,
                name: "ProductFindAI",
                description:
                    "Cut through the keyword-stuffed Amazon listings. Tell ProductFindAI what you want, get the one to buy.",
                potentialAction: {
                    "@type": "SearchAction",
                    target: {
                        "@type": "EntryPoint",
                        urlTemplate: `${siteUrl}/?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                },
            },
            {
                "@type": "Organization",
                "@id": `${siteUrl}/#organization`,
                name: "ProductFindAI",
                legalName: "SYE Group LLC",
                url: siteUrl,
                description:
                    "ProductFindAI cuts through Amazon's noise to find products actually worth buying using AI.",
                sameAs: [
                    "https://chrome.google.com/webstore",
                    "https://seohandoff.com",
                    "https://aisecretaryhelp.com",
                ],
                contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "customer support",
                    email: "hello@productfindai.com",
                    availableLanguage: "English",
                },
            },
            {
                "@type": "FAQPage",
                "@id": `${siteUrl}/#faq`,
                mainEntity: [
                    {
                        "@type": "Question",
                        name: "How is ProductFindAI different from Wirecutter or NerdWallet?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "Wirecutter and NerdWallet rank a small fixed set of products their editors have tested. ProductFindAI generates a fresh shortlist from any Amazon search you type, in any category, using AI, then links you to the product on Amazon to confirm the current price and rating.",
                        },
                    },
                    {
                        "@type": "Question",
                        name: "Are the recommendations independent or paid?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "Independent. No seller pays for placement. ProductFindAI earns a standard Amazon Associates referral fee when you buy through our links — the same Amazon affiliate program any blog or review site uses. The price you pay on Amazon is identical with or without our link.",
                        },
                    },
                    {
                        "@type": "Question",
                        name: "Do you actually verify prices and ratings?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "We never present a price or star rating as Amazon's unless it is pulled live from Amazon's Product Advertising API at search time. Until that live data is connected, we link you straight to the product on Amazon so you confirm the current price and rating there before you buy.",
                        },
                    },
                    {
                        "@type": "Question",
                        name: "Is ProductFindAI free?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "Yes. Search is free, the Chrome extension is free, and there's nothing to sign up for. The Amazon Associates referral fee on purchases is what funds the site.",
                        },
                    },
                ],
            },
            {
                "@type": "HowTo",
                "@id": `${siteUrl}/#howto`,
                name: "How to find the right Amazon product with ProductFindAI",
                description: "Type what you want, refine inside the results, click through to buy on Amazon.",
                totalTime: "PT2M",
                step: [
                    {
                        "@type": "HowToStep",
                        position: 1,
                        name: "Type what you want",
                        text: "Search for any product in plain language — 'standing desk under $300', 'wireless headphones for running', 'coffee grinder for espresso'.",
                    },
                    {
                        "@type": "HowToStep",
                        position: 2,
                        name: "Refine inside the results",
                        text: "Use the search-within-search to narrow the shortlist by price band, brand, feature, or any other constraint without leaving the page.",
                    },
                    {
                        "@type": "HowToStep",
                        position: 3,
                        name: "Click through to Amazon",
                        text: "Click any card to go to the product on Amazon and confirm the current price and rating before you buy, at the same price you'd pay anywhere.",
                    },
                ],
            },
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${displayFont.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
            <head>
                <JsonLd />
            </head>
            <body className="bg-[var(--color-bg)] text-[var(--color-surface)] font-sans antialiased">
                <ScrollToTopOnLoad />
                <ServiceWorkerRegistration />
                <Header />
                <main className="min-h-screen">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
