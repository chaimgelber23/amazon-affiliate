import { createClient } from '@supabase/supabase-js';

export const revalidate = 60;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500);
    const days  = parseInt(searchParams.get('days') ?? '7');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
        .from('external_deals')
        .select('*')
        .eq('status', 'live')
        .gte('posted_at', since.toISOString())
        .order('posted_at', { ascending: false })
        .limit(limit);

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    const deals = data ?? [];

    // If nothing in the window, fall back to the most recent deals ever
    if (deals.length === 0) {
        const { data: fallback } = await supabase
            .from('external_deals')
            .select('*')
            .eq('status', 'live')
            .order('posted_at', { ascending: false })
            .limit(limit);

        return Response.json({ deals: fallback ?? [], fallback: true });
    }

    return Response.json({ deals, fallback: false });
}
