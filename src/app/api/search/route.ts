import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 60;

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

async function fetchAmazonImage(asin: string): Promise<string | undefined> {
    try {
        const res = await fetch(`https://www.amazon.com/dp/${asin}`, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                Accept: "text/html",
                "Accept-Language": "en-US,en;q=0.9",
            },
            signal: AbortSignal.timeout(7000),
        });
        if (!res.ok) return undefined;
        const html = await res.text();
        // Try og:image first (most reliable)
        const og =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (og?.[1]) return og[1];
        // Fallback: landingImageUrl in JS data
        const js = html.match(/"landingImageUrl"\s*:\s*"([^"]+)"/);
        return js?.[1]?.replace(/\\\//g, "/");
    } catch {
        return undefined;
    }
}

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const chatMessages = Array.isArray(messages) && messages.length > 0 ? messages : null;
        if (!chatMessages) {
            return Response.json({ error: "Please enter a valid search query." }, { status: 400 });
        }

        const { text } = await generateText({
            model: google("gemini-2.5-flash-lite"),
            system: `You are PureFind's product recommendation engine. Cut through Amazon's noise and find genuinely great products.

RULES:
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

        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const data = JSON.parse(cleaned);

        // Fetch real Amazon product images in parallel
        const products = await Promise.all(
            (data.products as AIProduct[]).map(async (p) => ({
                ...p,
                imageUrl: p.asin !== "SEARCH" ? await fetchAmazonImage(p.asin) : undefined,
            }))
        );

        return Response.json({ ...data, products });
    } catch (error: unknown) {
        console.error("Search error:", error);
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("API key")) {
            return Response.json({ error: "Google AI API key not configured." }, { status: 500 });
        }
        return Response.json({ error: "Search failed. Please try again." }, { status: 500 });
    }
}
