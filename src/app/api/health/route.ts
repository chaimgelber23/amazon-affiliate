import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
    const checks: Record<string, "ok" | "error" | "skipped"> = {};

    // Check Supabase connectivity
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supaUrl && supaKey) {
        try {
            const client = createClient(supaUrl, supaKey);
            const { error } = await client.from("external_deals").select("asin").limit(1);
            checks.supabase = error ? "error" : "ok";
        } catch {
            checks.supabase = "error";
        }
    } else {
        checks.supabase = "skipped";
    }

    // Check Google AI key is set
    checks.gemini = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "ok" : "error";

    // Check Amazon tag is set
    checks.amazonTag = process.env.NEXT_PUBLIC_AMAZON_TAG ? "ok" : "skipped";

    const allOk = Object.values(checks).every((v) => v !== "error");

    return Response.json(
        {
            status: allOk ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            checks,
        },
        { status: allOk ? 200 : 503 },
    );
}
