import { NextRequest } from "next/server";

export const revalidate = 3600; // Cache image redirects for 1 hour

export async function GET(req: NextRequest) {
    const asin = req.nextUrl.searchParams.get("asin");

    if (!asin || asin === "SEARCH" || !/^[A-Z0-9]{10}$/i.test(asin)) {
        return new Response(null, { status: 404 });
    }

    try {
        const res = await fetch(`https://www.amazon.com/dp/${asin}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Cache-Control": "no-cache",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
            },
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) return new Response(null, { status: 404 });
        const html = await res.text();

        // og:image is the main product photo — most reliable
        const og =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (og?.[1]) {
            return Response.redirect(og[1], 302);
        }

        // Fallback: hiRes image embedded in the JS data
        const hiRes = html.match(/"hiRes"\s*:\s*"(https:[^"]+)"/);
        if (hiRes?.[1]) {
            return Response.redirect(hiRes[1].replace(/\\\//g, "/"), 302);
        }

        return new Response(null, { status: 404 });
    } catch {
        return new Response(null, { status: 404 });
    }
}
