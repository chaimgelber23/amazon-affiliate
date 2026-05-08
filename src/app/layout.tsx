import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ScrollToTopOnLoad } from "@/components/ScrollToTopOnLoad";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://productfindai.com";

const fraunces = Fraunces({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-display",
    axes: ["SOFT", "WONK"],
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
        default: "ProductFindAI — Save hours of Amazon research.",
        template: "%s | ProductFindAI",
    },
    description:
        "ProductFindAI filters the seller word salad and hands you the perfect product. Search any Amazon category, refine inside the results, install on Chrome.",
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
        title: "ProductFindAI — Save hours of Amazon research.",
        description:
            "ProductFindAI filters the seller word salad and hands you the perfect product. Free Chrome extension included.",
        url: siteUrl,
    },
    twitter: {
        card: "summary_large_image",
        title: "ProductFindAI — Save hours of Amazon research.",
        description:
            "ProductFindAI filters the seller word salad and hands you the perfect product.",
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
        <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
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
