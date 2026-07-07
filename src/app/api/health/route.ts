import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
    const checks: Record<string, "ok" | "error" | "skipped"> = {};

    // Check Supabase connectivity against ProductFindAI's own tables. The
    // previous deals-table check was from an older product shape and produced
    // false degraded health on the approval-facing app.
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supaKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supaUrl && supaKey) {
        try {
            const client = createClient(supaUrl, supaKey);
            const { error } = await client
                .from("pf_search_logs")
                .select("id", { count: "exact", head: true });
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
