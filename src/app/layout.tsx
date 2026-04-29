import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://purefind.vercel.app";

export const viewport: Viewport = {
    themeColor: "#0F172A",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
};

export const metadata: Metadata = {
    title: {
        default: "PureFind — AI Product Finder for Amazon (No Sponsored Junk)",
        template: "%s | PureFind",
    },
    description:
        "Tell PureFind what you need in plain English. AI picks 6-8 Amazon products, verifies real prices and ratings, and shows you what's actually worth buying. No deals page, no listicles.",
    metadataBase: new URL(siteUrl),
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "PureFind",
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        siteName: "PureFind",
        title: "PureFind — AI Product Finder for Amazon",
        description:
            "Plain-English product search. Real Amazon prices, real ratings, honest pros and cons. No sponsored placements, no deals page, no listicles.",
        url: siteUrl,
    },
    twitter: {
        card: "summary_large_image",
        title: "PureFind — AI Product Finder for Amazon",
        description:
            "Plain-English product search. Real Amazon prices, honest pros and cons, no sponsored junk.",
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
        "ai amazon search",
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
                name: "PureFind",
                description:
                    "AI product finder for Amazon. Real prices, honest pros and cons, zero sponsored placements.",
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
                name: "PureFind",
                url: siteUrl,
                description:
                    "PureFind cuts through Amazon's noise to find products actually worth buying using AI.",
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
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap"
                    rel="stylesheet"
                />
                <JsonLd />
            </head>
            <body className="bg-[var(--color-bg)] text-[var(--color-surface)] font-sans antialiased">
                <ServiceWorkerRegistration />
                <Header />
                <main className="min-h-screen">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
