import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
    title: {
        default: "PureFind — Find the Best Products on Amazon",
        template: "%s | PureFind",
    },
    description:
        "Cut through Amazon's SEO noise. Search for any product and PureFind's AI will find the best option worth buying.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://purefind.com"),
    openGraph: {
        type: "website",
        locale: "en_US",
        siteName: "PureFind",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@700;800;900&family=JetBrains+Mono:wght@500;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-[var(--color-bg)] text-[var(--color-surface)] font-sans antialiased">
                <Header />
                <main className="min-h-screen">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
