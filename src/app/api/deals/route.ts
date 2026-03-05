import { createClient } from '@supabase/supabase-js';

export const revalidate = 60;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source'); // filter by source
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
        .from('external_deals')
        .select('*')
        .eq('status', 'live')
        .order('posted_at', { ascending: false })
        .limit(limit);

    if (source) {
        query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ deals: data ?? [] });
}
