import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query || typeof query !== "string" || query.trim().length < 2) {
            return Response.json({ error: "Please enter a search query." }, { status: 400 });
        }

        const { text } = await generateText({
            model: google("gemini-2.0-flash"),
            system: `You are PureFind's product recommendation engine. Your job is to cut through Amazon's SEO noise and find the genuinely best products.

RULES:
- Return ONLY valid JSON, no markdown, no code fences, no extra text.
- Recommend 3-5 products ranked by genuine quality, not popularity.
- Be honest about cons. Every product has them.
- Use REAL Amazon ASINs when you are confident. If unsure, use "SEARCH" as the ASIN.
- Price estimates should reflect typical Amazon pricing.
- The "whyThisPick" field should explain why THIS product beats the alternatives in 1-2 sentences.

JSON SCHEMA:
{
  "summary": "One-line answer to the user's search",
  "products": [
    {
      "rank": 1,
      "title": "Product Name",
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
            prompt: `Find the best Amazon products for: "${query.trim()}"`,
        });

        // Parse the JSON from the AI response
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const data = JSON.parse(cleaned);

        return Response.json(data);
    } catch (error: any) {
        console.error("Search error:", error);

        if (error.message?.includes("API key")) {
            return Response.json(
                { error: "Google AI API key not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local" },
                { status: 500 }
            );
        }

        return Response.json(
            { error: "Search failed. Please try again." },
            { status: 500 }
        );
    }
}
