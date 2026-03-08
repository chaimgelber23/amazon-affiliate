import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest } from "next/server";

export const maxDuration = 30;

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

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
        return Response.json(
            { error: "Too many searches. Please wait a minute and try again." },
            { status: 429, headers: { ...CORS, "Retry-After": "60" } }
        );
    }

    try {
        const { messages } = await req.json();

        const chatMessages = Array.isArray(messages) && messages.length > 0 ? messages : null;
        if (!chatMessages) {
            return Response.json({ error: "Please enter a valid search query." }, { status: 400 });
        }

        const result = streamText({
            model: google("gemini-2.5-flash-lite"),
            system: `You are PureFind's product recommendation engine. Cut through Amazon's noise and find genuinely great products.

RULES:
- Auto-correct and understand misspelled queries. Figure out what the user actually meant.
- Return ONLY valid JSON — no markdown, no code fences, no extra text.
- Recommend 6-8 products ranked by genuine quality.
- Be honest about cons. Every product has them.
- Use REAL Amazon ASINs when confident. If unsure, use "SEARCH".
- Price estimates should reflect typical Amazon pricing.
- The "whyThisPick" field: 1-2 sentences explaining why this beats the alternatives.

JSON SCHEMA:
{
  "summary": "One-line answer to the user's search",
  "products": [
    {
      "rank": 1,
      "title": "Full Product Name",
      "asin": "B0XXXXXXXX",
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

        return result.toTextStreamResponse({ headers: CORS });
    } catch (error: unknown) {
        console.error("Search error:", error);
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("API key")) {
            return Response.json({ error: "Google AI API key not configured." }, { status: 500, headers: CORS });
        }
        return Response.json({ error: "Search failed. Please try again." }, { status: 500, headers: CORS });
    }
}
