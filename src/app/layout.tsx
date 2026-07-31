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
    themeColor: "#021F4E",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
};

export const metadata: Metadata = {
    title: {
        default: "ProductFindAI: Amazon product research done for you",
        template: "%s | ProductFindAI",
    },
    description:
        "Describe what you need. ProductFindAI uses official Amazon listing data when available and gives you a clearly labeled Amazon fallback when it is not.",
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
        title: "Amazon product research done for you.",
        description:
            "ProductFindAI uses official Amazon listing data when available and gives you a clearly labeled Amazon fallback when it is not.",
        url: siteUrl,
        images: [
            {
                url: "/opengraph-image",
                width: 1200,
                height: 630,
                alt: "ProductFindAI turns a detailed shopping request into an honest next step.",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Amazon product research done for you.",
        description:
            "ProductFindAI uses official Amazon listing data when available and gives you a clearly labeled Amazon fallback when it is not.",
        images: ["/opengraph-image"],
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
        icon: [
            {
                url: "/icons/productfindai-favicon-32.png",
                sizes: "32x32",
                type: "image/png",
            },
            {
                url: "/icons/productfindai-icon-192.png",
                sizes: "192x192",
                type: "image/png",
            },
        ],
        shortcut: "/icons/productfindai-favicon-32.png",
        apple: [
            {
                url: "/icons/productfindai-apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
            },
        ],
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
                inLanguage: "en-US",
                publisher: { "@id": `${siteUrl}/#organization` },
                description:
                    "Tell ProductFindAI what you want and get a short ranked list to compare before you click through to Amazon.",
            },
            {
                "@type": "Organization",
                "@id": `${siteUrl}/#organization`,
                name: "ProductFindAI",
                legalName: "SYE Group LLC",
                url: siteUrl,
                logo: {
                    "@type": "ImageObject",
                    url: `${siteUrl}/icons/productfindai-icon-512.png`,
                    width: 512,
                    height: 512,
                },
                description:
                    "ProductFindAI is a free product research tool that uses official Amazon listing data when available and provides an honest Amazon fallback when it is not.",
                knowsAbout: [
                    "Amazon product research",
                    "product comparison",
                    "product shortlists",
                ],
                contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "customer support",
                    email: "hello@seohandoff.com",
                    availableLanguage: "English",
                },
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
                <main id="main-content" tabIndex={-1} className="min-h-screen">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
