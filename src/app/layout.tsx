import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://purefind.com";

export const viewport: Viewport = {
    themeColor: "#1e293b",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
};

export const metadata: Metadata = {
    title: {
        default: "PureFind — AI-Powered Best Products on Amazon (No Sponsored Results)",
        template: "%s | PureFind",
    },
    description:
        "Skip sponsored junk. PureFind uses AI to find the genuinely best products on Amazon — real prices, real ratings, zero paid placements. Search any product and get honest recommendations in seconds.",
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
        title: "PureFind — Find the Best Products on Amazon Without the Noise",
        description:
            "AI-powered product recommendations that cut through Amazon's sponsored results. Real prices, real ratings, honest pros and cons.",
        url: siteUrl,
    },
    twitter: {
        card: "summary_large_image",
        title: "PureFind — AI Product Finder for Amazon",
        description:
            "Skip the sponsored noise. Get AI-powered honest product recommendations with real Amazon prices and ratings.",
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
        "best products amazon",
        "amazon product finder",
        "unbiased amazon reviews",
        "no sponsored results",
        "AI product recommendations",
        "amazon deals",
        "best amazon deals today",
        "product comparison tool",
    ],
};

// JSON-LD structured data for the site
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
                    "AI-powered product recommendations that cut through Amazon's sponsored results.",
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
                    href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Syne:wght@700;800&display=swap"
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
