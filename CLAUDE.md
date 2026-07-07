# PureFind — Claude-Specific Instructions

> Load `AGENTS.md` first — it has the ground-truth architecture, non-negotiables, and file map. This file is Claude-specific routing and cost rules only.

## Cost Discipline

Per the portfolio-wide cost discipline (passive income, near-zero fixed cost):

- **Scheduled jobs → cron-job.org.** Never put `crons: [...]` in `vercel.json`.
- **All cron routes default to `export const maxDuration = 60`** (hard ceiling). Current routes use 25.
- **Spend cap:** Vercel billing should be hard-capped at $20/mo.
- **Amazon official product API calls are quota-limited.** Creators API is preferred; legacy PA-API remains a fallback. The 1-hour Supabase cache is load-bearing — don't disable it.
- **Supabase service role key** is used only server-side; never expose it to the browser.

## Model Routing

| Task | Model | Why |
|------|-------|-----|
| Product ranking from query | Gemini 2.5 Pro with Flash fallback | Better recommendations, Flash covers quota/rate-limit pressure |
| Amazon product-data enrichment | deterministic code, no model | Amazon's official API is the source of truth |
| Schema / error diagnosis | Claude Sonnet | reasoning-heavy |
| Bulk content (if ever built) | Gemini Flash | 10x cheaper than Claude for volume |

## Brand Context

Load `docs/brand-context/` (if present) before writing any user-facing copy. The overall PureFind voice is honest-filter, anti-SEO-spam, consumer-advocate. Never fabricate ratings, review counts, or "editor's picks" — if Amazon's official API didn't return it, don't display it.

## When Something's Broken

1. Check Vercel function logs first: `GOOGLE_GENERATIVE_AI_API_KEY`, `AMAZON_CREATORS_API_*`, legacy `AMAZON_PAAPI_*`, and `SUPABASE_SERVICE_ROLE_KEY` are the usual suspects.
2. If `/api/search` returns 503 "Product verification unavailable" → Amazon official product API is down OR credentials are missing. Owner must check.
3. If you see an Amazon product API credential error → surface to owner; do NOT re-enable the scraper.
4. The Chrome extension is paused during Associates approval; do not make it the production path.

## Testing

No test framework currently. Manual smoke test after any Amazon product API change:

```bash
curl -s -X POST https://productfindai.com/api/search \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"quiet mechanical keyboard"}]}' \
  | jq '.products[0]'
```

Expect when official data is available: real `asin`, real `priceEstimate` only if Amazon returned an offer price, real `imageUrl` from Amazon, `verified: true`.

## Security

- All secrets in `process.env` — never hardcode
- `.env.local` gitignored
- Creators API / PA-API secrets must not leak to the browser — they are server-only
- `NEXT_PUBLIC_*` is the ONLY prefix that ships to the client bundle
