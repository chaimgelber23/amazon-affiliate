import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Live Amazon Deals — Real-Time Price Drops & Lightning Deals",
    description:
        "Track the best Amazon deals in real time. Live price drops, lightning deals, and verified discounts updated every minute. Never miss a great deal again.",
    alternates: {
        canonical: "/deals",
    },
    openGraph: {
        title: "Live Amazon Deals — Updated Every Minute",
        description:
            "Real-time Amazon deal tracker. See the hottest price drops and lightning deals, verified and updated every minute.",
    },
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
