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
        default: "PureFind — Save hours of Amazon research.",
        template: "%s | PureFind",
    },
    description:
        "PureFind filters the seller word salad and hands you the perfect product. Search any Amazon category, refine inside the results, install on Chrome.",
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
        title: "PureFind — Save hours of Amazon research.",
        description:
            "PureFind filters the seller word salad and hands you the perfect product. Free Chrome extension included.",
        url: siteUrl,
    },
    twitter: {
        card: "summary_large_image",
        title: "PureFind — Save hours of Amazon research.",
        description:
            "PureFind filters the seller word salad and hands you the perfect product.",
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
                name: "PureFind",
                description:
                    "Cut through the keyword-stuffed Amazon listings. Tell PureFind what you want, get the one to buy.",
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
                    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Geist+Mono:wght@500;600;700&display=swap"
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
