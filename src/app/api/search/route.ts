import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { enrichProducts } from "@/lib/amazon-paapi";
import { logSearch, logError } from "@/lib/analytics";

export const maxDuration = 25;

// Quality tier — 2.5 Pro is the reasoning model; Flash is the fast fallback
// when Pro is rate-limited or errors. Flash-Lite is too shallow for "find the
// genuinely best product" and was the prior default; do not revert.
const PRIMARY_MODEL = "gemini-2.5-pro";
const FALLBACK_MODEL = "gemini-2.5-flash";

// Server-side AI response cache TTL. Identical normalized query → same picks
// for 24h. Saves Gemini quota; PA-API enrichment still re-runs (cached 1h).
const AI_CACHE_TTL_HOURS = 24;

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

// Compact prior-products view for the refinement system prompt.
// We don't trust whatever shape the client sent — coerce to a known minimum.
interface PriorProduct {
    rank: number;
    title: string;
    priceEstimate?: string;
    rating?: number;
    category?: string;
}

function coercePriorProducts(raw: unknown): PriorProduct[] | null {
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const out: PriorProduct[] = [];
    for (const r of raw) {
        if (!r || typeof r !== "object") continue;
        const o = r as Record<string, unknown>;
        const title = typeof o.title === "string" ? o.title : null;
        if (!title) continue;
        out.push({
            rank: typeof o.rank === "number" ? o.rank : out.length + 1,
            title,
            priceEstimate: typeof o.priceEstimate === "string" ? o.priceEstimate : undefined,
            rating: typeof o.rating === "number" ? o.rating : undefined,
            category: typeof o.category === "string" ? o.category : undefined,
        });
    }
    return out.length > 0 ? out : null;
}

const BASE_RULES = `RULES:
- Auto-correct and understand misspelled queries. Figure out what the user actually meant.
- Return ONLY valid JSON — no markdown, no code fences, no prose before or after the JSON object.
- Span price tiers when the query allows: include at least one budget pick, one mid-range pick, and one premium pick UNLESS the query already constrains price (e.g. "under $100"). Tag each with the "tier" field.
- Diversify across brands and use cases when relevant. Don't return 8 near-identical models from the same brand.
- Be honest about cons. Every product has them. Pros and cons must be specific (not "great quality" or "good value").
- ALWAYS use "SEARCH" for the asin field. Never guess or invent an ASIN — they change constantly and wrong ASINs break product links.
- Price estimates should reflect typical Amazon pricing as of the current year, not historical pricing.
- The "whyThisPick" field: 1-2 sentences explaining why this beats the alternatives. Reference specific specs, reviewer consensus, or use-case fit — not vague praise.
- For product titles, use the EXACT full product name as it appears on Amazon (brand + model + key specs). This is critical for PA-API matching.
- Set "confidence" to "high" only when you'd recommend this to a friend without hesitation; "medium" if it's a reasonable pick with caveats; "low" if you're guessing. Be calibrated — overconfidence is a bug.
- If you used Google Search to ground these picks, do NOT include citation markers, footnote numbers, or source URLs anywhere in the JSON. Use the search results to inform your reasoning silently. Output the JSON object only.`;

const JSON_SCHEMA_BLOCK = `JSON SCHEMA:
{
  "summary": "One-line answer to the user's search",
  "products": [
    {
      "rank": 1,
      "title": "Full Product Name as it appears on Amazon",
      "asin": "SEARCH",
      "whyThisPick": "Why this is the best option",
      "pros": ["specific pro 1", "specific pro 2", "specific pro 3"],
      "cons": ["honest con 1", "honest con 2"],
      "priceEstimate": "$XX.XX",
      "rating": 4.5,
      "category": "Category Name",
      "confidence": "high",
      "tier": "mid"
    }
  ]
}`;

function buildFreshSystemPrompt(): string {
    return `You are PureFind's product recommendation engine. Cut through Amazon's noise and find genuinely great products.

${BASE_RULES}
- Recommend 6-8 products ranked by genuine quality.

${JSON_SCHEMA_BLOCK}`;
}

function buildRefinementSystemPrompt(prior: PriorProduct[], originalQuery: string, newConstraint: string): string {
    const priorList = prior.slice(0, 8).map((p) => {
        const bits = [`${p.rank}. ${p.title}`];
        if (p.priceEstimate) bits.push(`(${p.priceEstimate})`);
        if (typeof p.rating === "number") bits.push(`★${p.rating}`);
        return bits.join(" ");
    }).join("\n");

    return `You are PureFind's product refinement engine. The user already saw a curated shortlist for "${originalQuery}" and now wants to NARROW it down. Your job is to filter, rerank, and (only if needed) substitute — NOT to start a fresh search.

PRIOR SHORTLIST (what the user already saw):
${priorList}

NEW CONSTRAINT FROM THE USER: "${newConstraint}"

REFINEMENT RULES:
- Read the new constraint carefully. It may be a price filter ("under $200"), a feature filter ("wireless", "walnut"), a use-case filter ("for a small office"), or a quality filter ("higher rated").
- FIRST PASS: Keep only products from the prior shortlist that genuinely satisfy the new constraint. Drop the ones that don't.
- If 4 or more prior products survive, return them — reranked best-fit-first. Do NOT pad with new picks just to hit 6.
- If fewer than 4 survive, add 2-3 NEW picks that satisfy BOTH the original query "${originalQuery}" AND the new constraint "${newConstraint}". Place new picks AFTER the surviving prior picks.
- "summary" must explicitly acknowledge the refinement (e.g. "Of your standing desks, here are the ones under $200..." or "Filtered to wireless models — kept N from your prior list, added N new picks.").

${BASE_RULES}

${JSON_SCHEMA_BLOCK}`;
}

// ── Server-side AI cache (skipped for refinement; refinement is contextual) ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _aiCacheClient: SupabaseClient<any, any, any> | null = null;
function getAiCacheClient() {
    if (_aiCacheClient) return _aiCacheClient;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    _aiCacheClient = createClient(url, key);
    return _aiCacheClient;
}

function normalizeQueryForCache(q: string): string {
    return q.toLowerCase().trim().replace(/\s+/g, " ").slice(0, 500);
}

function aiCacheKey(query: string): string {
    return crypto
        .createHash("sha256")
        .update(`${normalizeQueryForCache(query)}|v3`)
        .digest("hex");
}

async function getAiCached(query: string): Promise<AIResponse | null> {
    const sb = getAiCacheClient();
    if (!sb) return null;
    const cutoff = new Date(Date.now() - AI_CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
    const { data, error } = await sb
        .from("pf_ai_cache")
        .select("response, created_at")
        .eq("query_hash", aiCacheKey(query))
        .gte("created_at", cutoff)
        .maybeSingle();
    if (error || !data) return null;
    return (data.response as AIResponse) ?? null;
}

async function setAiCached(query: string, model: string, response: AIResponse): Promise<void> {
    const sb = getAiCacheClient();
    if (!sb) return;
    await sb
        .from("pf_ai_cache")
        .upsert(
            {
                query_hash: aiCacheKey(query),
                query: normalizeQueryForCache(query),
                model,
                response,
                created_at: new Date().toISOString(),
            },
            { onConflict: "query_hash" },
        )
        .then(({ error }) => {
            if (error) console.warn("[ai-cache] upsert failed:", error.message);
        });
}

// ── JSON parsing + Claude repair fallback ────────────────────────────────────

function tryParseAiResponse(text: string): AIResponse | null {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.products)) {
            return parsed as AIResponse;
        }
        return null;
    } catch {
        return null;
    }
}

async function repairJsonWithClaude(text: string): Promise<AIResponse | null> {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    try {
        const repair = await generateText({
            model: anthropic("claude-haiku-4-5-20251001"),
            system: "You are a JSON repair tool. The user provides text that should be valid JSON but isn't. Return ONLY the corrected JSON object — no prose, no fences, no commentary.",
            messages: [
                {
                    role: "user" as const,
                    content: `Repair this into valid JSON matching {summary: string, products: Array<{rank, title, asin, whyThisPick, pros, cons, priceEstimate, rating, category, confidence?, tier?}>}. Preserve every product. Input:\n\n${text}`,
                },
            ],
        });
        return tryParseAiResponse(repair.text);
    } catch (err) {
        console.warn(
            "[search] Claude JSON repair failed:",
            err instanceof Error ? err.message : err,
        );
        return null;
    }
}

// ── Model-selection chain: Pro → Flash → Claude-repair ───────────────────────

type ChatRole = "user" | "assistant" | "system";
type ChatMessage = { role: ChatRole; content: string };

function coerceChatMessages(raw: Array<{ role: string; content: string }>): ChatMessage[] {
    return raw
        .filter((m) => m && typeof m.content === "string")
        .map((m) => {
            const role: ChatRole =
                m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user";
            return { role, content: m.content };
        });
}

async function generateWithFallback(
    systemPrompt: string,
    messages: ChatMessage[],
): Promise<{ aiData: AIResponse; modelUsed: string; grounded: boolean }> {
    // Google Search grounding: lets Gemini fetch current web results so picks
    // reflect 2026 reality, not the early-2025 training cutoff. Trade-off: adds
    // 1-3s latency and the model occasionally embeds citation markers, which is
    // why the Claude Haiku JSON-repair path exists downstream.
    const groundingTools = { google_search: google.tools.googleSearch({}) };

    const tryModel = async (modelId: string, withGrounding: boolean) => {
        try {
            const result = await generateText({
                model: google(modelId),
                system: systemPrompt,
                messages,
                ...(withGrounding ? { tools: groundingTools } : {}),
            });
            return { ok: true as const, text: result.text };
        } catch (err) {
            return {
                ok: false as const,
                err: err instanceof Error ? err.message : String(err),
            };
        }
    };

    // Try order: Pro+grounding → Pro alone → Flash+grounding → Flash alone.
    // Grounding can fail independently of the model (search backend errors),
    // so we always have an ungrounded retry before escalating tiers.
    let modelUsed = PRIMARY_MODEL;
    let grounded = true;
    let raw = "";

    const primaryGrounded = await tryModel(PRIMARY_MODEL, true);
    if (primaryGrounded.ok) {
        raw = primaryGrounded.text;
    } else {
        console.warn(`[search] ${PRIMARY_MODEL} grounded failed: ${primaryGrounded.err}`);
        const primaryPlain = await tryModel(PRIMARY_MODEL, false);
        if (primaryPlain.ok) {
            raw = primaryPlain.text;
            grounded = false;
        } else {
            console.warn(`[search] ${PRIMARY_MODEL} ungrounded failed: ${primaryPlain.err}`);
            modelUsed = FALLBACK_MODEL;
            const fallbackGrounded = await tryModel(FALLBACK_MODEL, true);
            if (fallbackGrounded.ok) {
                raw = fallbackGrounded.text;
            } else {
                const fallbackPlain = await tryModel(FALLBACK_MODEL, false);
                if (!fallbackPlain.ok) {
                    throw new Error(`All Gemini paths failed (last: ${fallbackPlain.err})`);
                }
                raw = fallbackPlain.text;
                grounded = false;
            }
        }
    }

    let parsed = tryParseAiResponse(raw);
    if (!parsed) {
        const repaired = await repairJsonWithClaude(raw);
        if (repaired) {
            console.log("[search] JSON repaired via Claude Haiku");
            parsed = repaired;
        }
    }
    if (!parsed) throw new Error("AI returned unparseable response and repair failed");

    return { aiData: parsed, modelUsed, grounded };
}

// ── Post-enrichment reranker ─────────────────────────────────────────────────
// AI rank reflects training-data confidence. Real Amazon signal (review count
// + star rating) reflects actual market validation. We rerank using both —
// not a flip, but a tiebreaker that demotes thin-evidence picks.

interface EnrichedProductRow {
    rank: number;
    title: string;
    asin: string;
    whyThisPick: string;
    pros: string[];
    cons: string[];
    priceEstimate: string;
    rating: number;
    category: string;
    imageUrl?: string;
    reviewCount?: number;
    verified: boolean;
    aiRank: number;
}

function qualityScore(p: EnrichedProductRow): number {
    let score = 0;
    if (p.verified) score += 50;
    const rating = typeof p.rating === "number" ? p.rating : 0;
    const reviews = typeof p.reviewCount === "number" ? p.reviewCount : 0;
    score += rating * 10;
    if (reviews >= 10000) score += 30;
    else if (reviews >= 1000) score += 22;
    else if (reviews >= 100) score += 12;
    else if (reviews >= 10) score += 4;
    else score -= 15;
    if (rating < 4.0 && reviews >= 50) score -= 20;
    if (!p.priceEstimate || p.priceEstimate === "—") score -= 10;
    score -= p.aiRank * 0.5;
    return score;
}

function rerankByQuality(rows: EnrichedProductRow[]): EnrichedProductRow[] {
    const sorted = [...rows].sort((a, b) => qualityScore(b) - qualityScore(a));
    return sorted.map((row, i) => ({ ...row, rank: i + 1 }));
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
        const body = await req.json();
        const { messages, priorProducts: rawPrior, originalQuery: rawOriginal } = body;

        const chatMessages = Array.isArray(messages) && messages.length > 0 ? messages : null;
        if (!chatMessages) {
            return Response.json({ error: "Please enter a valid search query." }, { status: 400, headers: CORS });
        }

        // Extract the user's latest query for analytics
        userQuery = chatMessages[chatMessages.length - 1]?.content ?? "";

        // Refinement detection: client sends `priorProducts` when narrowing.
        // The legacy multi-turn `messages` shape (assistant-JSON-blob + new user
        // message) is treated as a fresh search — that path was the bug.
        const priorProducts = coercePriorProducts(rawPrior);
        const isRefinement = priorProducts !== null;

        // Build the right system prompt + the right messages payload.
        // For refinement we pass ONLY the new user constraint as a single-turn
        // message, with the prior list living in the system prompt where the
        // model treats it as ground truth instead of as conversation noise.
        const systemPrompt = isRefinement
            ? buildRefinementSystemPrompt(
                priorProducts,
                typeof rawOriginal === "string" && rawOriginal.trim() ? rawOriginal.trim() : "the original query",
                userQuery,
            )
            : buildFreshSystemPrompt();

        const messagesForModel: ChatMessage[] = isRefinement
            ? [{ role: "user", content: userQuery }]
            : coerceChatMessages(chatMessages);

        // Cache: skip on refinement (each refinement is contextual to a prior list).
        let aiData: AIResponse | null = null;
        let modelUsed = "cache";
        let cacheHit = false;
        let grounded = false;
        if (!isRefinement) {
            const cached = await getAiCached(userQuery);
            if (cached) {
                aiData = cached;
                cacheHit = true;
            }
        }

        // Generate via Pro+grounding → Pro plain → Flash+grounding → Flash plain → Claude-repair
        if (!aiData) {
            try {
                const out = await generateWithFallback(systemPrompt, messagesForModel);
                aiData = out.aiData;
                modelUsed = out.modelUsed;
                grounded = out.grounded;
            } catch (genErr) {
                const msg = genErr instanceof Error ? genErr.message : String(genErr);
                logError({ route: "/api/search", error: `AI generation failed: ${msg}`, ip, extra: { query: userQuery } });
                return Response.json({ error: "AI is temporarily unavailable. Please try again." }, { status: 503, headers: { ...CORS, "Retry-After": "30" } });
            }
            if (!isRefinement) {
                setAiCached(userQuery, modelUsed, aiData).catch(() => {});
            }
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

        // Map enriched data to row shape, then rerank by real-Amazon-signal quality.
        // Preserve the AI's original rank as `aiRank` for the score function.
        const rows: EnrichedProductRow[] = enriched.map((p, i) => ({
            rank: (p.rank as number) ?? i + 1,
            aiRank: (p.rank as number) ?? i + 1,
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
        }));

        const reranked = rerankByQuality(rows);

        const response = {
            summary: aiData.summary,
            products: reranked.map((p) => ({
                rank: p.rank,
                title: p.title,
                asin: p.asin,
                whyThisPick: p.whyThisPick,
                pros: p.pros,
                cons: p.cons,
                priceEstimate: p.priceEstimate,
                rating: p.rating,
                category: p.category,
                imageUrl: p.imageUrl,
                reviewCount: p.reviewCount,
                verified: p.verified,
            })),
            enriched: reranked.some((p) => p.verified),
            meta: { model: modelUsed, cached: cacheHit, grounded },
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
