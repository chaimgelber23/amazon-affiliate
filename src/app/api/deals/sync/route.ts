// @ts-nocheck — route is temporarily disabled; re-enable type checking when reactivated
import { createClient } from '@supabase/supabase-js';
import { ALL_SOURCES } from '@/lib/deal-sources';
import {
    extractAmazonUrl,
    extractAsin,
    extractPrice,
    buildAffiliateUrl,
    isDead,
} from '@/lib/deal-sources/_base';

export const maxDuration = 60;

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key);
}

export async function POST(req: Request) {
    // Temporarily disabled to save Vercel CPU
    return Response.json({ disabled: true }, { status: 503 });

    // Verify secret to prevent unauthorized triggers
    const secret = req.headers.get('x-cron-secret');
    if (secret !== process.env.CRON_SECRET) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    let inserted = 0;
    let expired = 0;
    let skipped = 0;

    // Fetch all sources in parallel
    const results = await Promise.allSettled(
        ALL_SOURCES.map(async (source) => {
            const rawDeals = await source.fetch();
            return { sourceId: source.id, rawDeals };
        })
    );

    for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { sourceId, rawDeals } = (result as any).value;

        for (const raw of rawDeals) {
            // Check if deal is being marked as dead
            if (isDead(raw.title)) {
                // Try to extract ASIN and mark expired in DB
                const amazonUrl = extractAmazonUrl(raw.contentHtml) ?? extractAmazonUrl(raw.dealPageUrl);
                if (amazonUrl) {
                    const asin = extractAsin(amazonUrl);
                    if (asin) {
                        await supabase
                            .from('external_deals')
                            .update({ status: 'expired', expired_at: new Date().toISOString() })
                            .eq('asin', asin)
                            .eq('status', 'live');
                        expired++;
                    }
                }
                continue;
            }

            // Find Amazon URL in the deal content
            const amazonUrl =
                extractAmazonUrl(raw.contentHtml) ??
                extractAmazonUrl(raw.title) ??
                extractAmazonUrl(raw.dealPageUrl);

            if (!amazonUrl) {
                skipped++;
                continue; // Not an Amazon deal — skip
            }

            const asin = extractAsin(amazonUrl);
            if (!asin) {
                skipped++;
                continue; // Can't extract ASIN — skip
            }

            const affiliateUrl = buildAffiliateUrl(asin);
            const price = extractPrice(raw.title);
            const now = new Date().toISOString();

            // Upsert: insert new, or update last_seen_at + sources list if already exists
            const { error } = await supabase.from('external_deals').upsert(
                {
                    asin,
                    title: raw.title,
                    amazon_url: affiliateUrl,
                    source: sourceId,
                    sources: [sourceId],
                    status: 'live',
                    price,
                    image_url: raw.imageUrl ?? null,
                    original_deal_url: raw.dealPageUrl || null,
                    posted_at: raw.publishedAt ?? now,
                    last_seen_at: now,
                },
                {
                    onConflict: 'asin',
                    ignoreDuplicates: false,
                }
            );

            if (error) {
                console.error(`[sync] upsert error for ${asin}:`, error.message);
            } else {
                inserted++;
            }

            // If this source isn't already in the sources array, append it
            try {
                await supabase.rpc('append_deal_source', { p_asin: asin, p_source: sourceId });
            } catch {
                // Non-critical — ignore if RPC not yet deployed
            }
        }
    }

    // Mark deals not seen in >2 hours as expired
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    await supabase
        .from('external_deals')
        .update({ status: 'expired', expired_at: new Date().toISOString() })
        .eq('status', 'live')
        .lt('last_seen_at', twoHoursAgo);

    return Response.json({ inserted, expired, skipped });
}
