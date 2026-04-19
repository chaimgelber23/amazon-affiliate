import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "m.media-amazon.com" },
            { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
            { protocol: "https", hostname: "images.unsplash.com" },
        ],
    },
    // The `amazon-paapi` / `paapi5-nodejs-sdk` package uses bare-name requires
    // internally (e.g. `require("api/DefaultApi")`) that webpack can't resolve.
    // Treat it as a server-side external so Node's own CommonJS resolver handles it.
    serverExternalPackages: ["amazon-paapi", "paapi5-nodejs-sdk"],
};

export default nextConfig;
