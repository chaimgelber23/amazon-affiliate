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
        "Skip the filler. Search for any product and PureFind's AI finds the best one worth buying — straight to Amazon with your price and Prime shipping.",
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
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-white text-[var(--color-surface)] font-sans antialiased">
                <Header />
                <main className="min-h-screen">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
