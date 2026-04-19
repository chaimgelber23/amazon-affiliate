# PureFind — Claude-Specific Instructions

> Load `AGENTS.md` first — it has the ground-truth architecture, non-negotiables, and file map. This file is Claude-specific routing and cost rules only.

## Cost Discipline

Per the portfolio-wide cost discipline (passive income, near-zero fixed cost):

- **Scheduled jobs → cron-job.org.** Never put `crons: [...]` in `vercel.json`.
- **All cron routes default to `export const maxDuration = 60`** (hard ceiling). Current routes use 25.
- **Spend cap:** Vercel billing should be hard-capped at $20/mo.
- **PA-API is free per call** but throttled to 1 TPS baseline (scales with attributed revenue). The 24h Supabase cache is load-bearing — don't disable it.
- **Supabase service role key** is used only server-side; never expose it to the browser.

## Model Routing

| Task | Model | Why |
|------|-------|-----|
| Product ranking from query | Gemini 2.5 Flash Lite | ~free, fast enough |
| PA-API enrichment | deterministic code, no model | Amazon's API is the source of truth |
| Schema / error diagnosis | Claude Sonnet | reasoning-heavy |
| Bulk content (if ever built) | Gemini Flash | 10x cheaper than Claude for volume |

## Brand Context

Load `docs/brand-context/` (if present) before writing any user-facing copy. The overall PureFind voice is honest-filter, anti-SEO-spam, consumer-advocate. Never fabricate ratings, review counts, or "editor's picks" — if PA-API didn't return it, don't display it.

## When Something's Broken

1. Check Vercel function logs first: `GOOGLE_GENERATIVE_AI_API_KEY`, `AMAZON_PAAPI_*`, `SUPABASE_SERVICE_ROLE_KEY` are the usual suspects.
2. If `/api/search` returns 503 "Product verification unavailable" → PA-API is down OR credentials are missing. Owner must check.
3. If you see a `PA-API not configured` error → surface to owner; do NOT re-enable the scraper.
4. If the Chrome extension breaks on Amazon → check host_permissions in `extension/manifest.json`. It's intentionally scoped to `amazon.com/s*`.

## Testing

No test framework currently. Manual smoke test after any PA-API change:

```bash
curl -s -X POST https://purefind.vercel.app/api/search \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"quiet mechanical keyboard"}]}' \
  | jq '.products[0]'
```

Expect: real `asin`, real `priceEstimate` from Amazon, real `imageUrl` from `m.media-amazon.com`, `verified: true`.

## Security

- All secrets in `process.env` — never hardcode
- `.env.local` gitignored
- PA-API secret key must not leak to the browser — it's server-only
- `NEXT_PUBLIC_*` is the ONLY prefix that ships to the client bundle
