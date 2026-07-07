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
        "Type what you want and ProductFindAI returns a short ranked list with the catch on each pick. Refine in place without starting over.",
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
            "Type what you want and ProductFindAI returns a short ranked list with the catch on each pick. Refine in place without starting over.",
        url: siteUrl,
    },
    twitter: {
        card: "summary_large_image",
        title: "We do the product research. You get about 7 ranked picks.",
        description:
            "Type what you want and ProductFindAI returns a short ranked list with the catch on each pick. Refine in place without starting over.",
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
                    "Tell ProductFindAI what you want and get a short ranked list to compare before you click through to Amazon.",
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
                    "ProductFindAI creates short ranked Amazon product lists from plain-language searches.",
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
                            text: "Wirecutter and NerdWallet publish fixed editorial picks. ProductFindAI creates a shortlist from the Amazon search you type, then uses Amazon's official product data when it is available. We show why each pick may fit and send you to Amazon to confirm current details.",
                        },
                    },
                    {
                        "@type": "Question",
                        name: "Are the recommendations independent or paid?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "No seller pays for placement. As an Amazon Associate I earn from qualifying purchases. ProductFindAI may earn a referral fee when you buy through links on this site, at no extra cost to you.",
                        },
                    },
                    {
                        "@type": "Question",
                        name: "Do you actually verify prices and ratings?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "We never present a price or star rating as Amazon's unless it is pulled from Amazon's official product API at search time. Until that live data is connected, we link you straight to the product on Amazon so you confirm the current price and rating there before you buy.",
                        },
                    },
                    {
                        "@type": "Question",
                        name: "Is ProductFindAI free?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "Yes. Search is free and there is nothing to sign up for. Amazon Associates referral fees help fund the site.",
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
                        text: "Click any card to go to Amazon and confirm the current price, rating, availability, shipping, and return details before you buy.",
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
