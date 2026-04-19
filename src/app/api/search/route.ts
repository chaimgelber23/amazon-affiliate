import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest } from "next/server";
import { enrichProducts } from "@/lib/amazon-paapi";
import { logSearch, logError } from "@/lib/analytics";

export const maxDuration = 25;

// Allow Chrome extension and other origins to call this API
const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS });
}

// Simple in-memory rate limiter (per warm serverless instance)
// Limits each IP to 10 searches per minute
const ipRequests = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (ipRequests.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) return true;
    recent.push(now);
    ipRequests.set(ip, recent);
    // Prevent unbounded growth
    if (ipRequests.size > 5000) {
        for (const [key, times] of ipRequests) {
            if (times.every(t => now - t >= WINDOW_MS)) ipRequests.delete(key);
        }
    }
    return false;
}

interface AIProduct {
    rank: number;
    title: string;
    asin: string;
    whyThisPick: string;
    pros: string[];
    cons: string[];
    priceEstimate: string;
    rating: number;
    category: string;
}

interface AIResponse {
    summary: string;
    products: AIProduct[];
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
        return Response.json(
            { error: "Too many searches. Please wait a minute and try again." },
            { status: 429, headers: { ...CORS, "Retry-After": "60" } }
        );
    }

    const startTime = Date.now();
    let userQuery = "";

    try {
        const { messages } = await req.json();

        const chatMessages = Array.isArray(messages) && messages.length > 0 ? messages : null;
        if (!chatMessages) {
            return Response.json({ error: "Please enter a valid search query." }, { status: 400, headers: CORS });
        }

        // Extract the user's query for analytics
        userQuery = chatMessages[chatMessages.length - 1]?.content ?? "";

        // Generate AI recommendations (buffered, not streamed)
        const result = await generateText({
            model: google("gemini-2.5-flash-lite"),
            system: `You are PureFind's product recommendation engine. Cut through Amazon's noise and find genuinely great products.

RULES:
- Auto-correct and understand misspelled queries. Figure out what the user actually meant.
- Return ONLY valid JSON — no markdown, no code fences, no extra text.
- Recommend 6-8 products ranked by genuine quality.
- Be honest about cons. Every product has them.
- ALWAYS use "SEARCH" for the asin field. Never guess or invent an ASIN — they change constantly and wrong ASINs break product links.
- Price estimates should reflect typical Amazon pricing.
- The "whyThisPick" field: 1-2 sentences explaining why this beats the alternatives.
- For product titles, use the EXACT full product name as it appears on Amazon (brand + model + key specs). This is critical for matching.

JSON SCHEMA:
{
  "summary": "One-line answer to the user's search",
  "products": [
    {
      "rank": 1,
      "title": "Full Product Name",
      "asin": "SEARCH",
      "whyThisPick": "Why this is the best option",
      "pros": ["pro 1", "pro 2", "pro 3"],
      "cons": ["con 1", "con 2"],
      "priceEstimate": "$XX.XX",
      "rating": 4.5,
      "category": "Category Name"
    }
  ]
}`,
            messages: chatMessages,
        });

        // Parse AI response
        const cleaned = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        let aiData: AIResponse;
        try {
            aiData = JSON.parse(cleaned);
        } catch {
            // If AI returned invalid JSON, return it raw and let client handle
            return new Response(cleaned, { headers: { ...CORS, "Content-Type": "text/plain" } });
        }

        // Enrich with real Amazon data via PA-API 5.0 (ASINs, prices, images, ratings).
        // The partner tag is sourced inside amazon-paapi.ts from AMAZON_PAAPI_PARTNER_TAG
        // (falling back to NEXT_PUBLIC_AMAZON_TAG).
        const productsForEnrichment = aiData.products.map((p) => ({
            ...p,
            title: p.title,
            asin: p.asin,
        })) as Array<{ title: string; asin?: string;[key: string]: unknown }>;

        let enriched: Awaited<ReturnType<typeof enrichProducts>>;
        try {
            enriched = await enrichProducts(productsForEnrichment);
        } catch (paapiErr) {
            const msg = paapiErr instanceof Error ? paapiErr.message : "PA-API call failed";
            logError({
                route: "/api/search",
                error: `PA-API failure: ${msg}`,
                ip,
                extra: { query: userQuery },
            });
            return Response.json(
                { error: "Product verification unavailable — please try again shortly." },
                { status: 503, headers: { ...CORS, "Retry-After": "30" } },
            );
        }

        // Build the enriched response
        const response = {
            summary: aiData.summary,
            products: enriched.map((p) => ({
                rank: p.rank as number,
                title: (p.amazonData?.title as string) || (p.title as string),
                asin: p.amazonData?.asin || (p.asin as string),
                whyThisPick: p.whyThisPick as string,
                pros: p.pros as string[],
                cons: p.cons as string[],
                priceEstimate: p.amazonData?.price || (p.priceEstimate as string),
                rating: p.amazonData?.rating || (p.rating as number),
                category: p.category as string,
                imageUrl: p.amazonData?.imageUrl,
                reviewCount: p.amazonData?.reviewCount,
                verified: !!p.amazonData,
            })),
            enriched: enriched.some((p) => p.amazonData),
        };

        // Log search analytics (fire-and-forget)
        logSearch({
            query: userQuery,
            ip,
            resultCount: response.products.length,
            enrichedCount: response.products.filter((p) => p.verified).length,
            durationMs: Date.now() - startTime,
        });

        return Response.json(response, { headers: CORS });
    } catch (error: unknown) {
        console.error("Search error:", error);
        const msg = error instanceof Error ? error.message : "";

        // Log the error (fire-and-forget)
        logError({
            route: "/api/search",
            error: msg || "Unknown search error",
            ip,
            extra: { query: userQuery },
        });

        if (msg.includes("API key")) {
            return Response.json({ error: "Google AI API key not configured." }, { status: 500, headers: CORS });
        }
        return Response.json({ error: "Search failed. Please try again." }, { status: 500, headers: CORS });
    }
}
