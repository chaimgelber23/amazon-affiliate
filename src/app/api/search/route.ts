import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
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

        return result.toTextStreamResponse();
    } catch (error: unknown) {
        console.error("Search error:", error);
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("API key")) {
            return Response.json({ error: "Google AI API key not configured." }, { status: 500 });
        }
        return Response.json({ error: "Search failed. Please try again." }, { status: 500 });
    }
}
