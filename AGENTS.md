# Agent Instructions — PureFind

> This file loads in any AI environment (Claude Code, Antigravity, Cursor, etc.).
> For Claude-specific routing see `CLAUDE.md`.

## Ground Truth

PureFind is:

- A Next.js 15 single-page AI product search at `purefind.vercel.app`
- A Chrome extension (`extension/`) that surfaces the same search on `amazon.com/s*` pages
- A 24h Supabase cache on Amazon Product Advertising API 5.0 responses

Nothing else is built. If an agent's plan refers to "editorial review pages", "slugged product pages", "comparison pages", or a "self-improvement loop" — the plan is out of date. Those were scaffolded in early design docs and never shipped. See `directives/README.md`.

## Non-Negotiables (regulatory-grade)

1. **No scraping Amazon.** The Associates Operating Agreement §5 forbids screen-scraping or data-mining Amazon. Violations = permanent Associates ban = business dead. All product data comes from PA-API (`src/lib/amazon-paapi.ts`). The old scraper (`src/lib/amazon-lookup.legacy.ts`) throws at import unless `AMAZON_ALLOW_SCRAPE=1` is explicitly set — NEVER set that in production.

2. **No self-referrals.** Operating Agreement §6 prohibits affiliate-tagged links FROM Amazon properties. The Chrome extension detects when it's embedded on amazon.com and strips the tag from outbound URLs (see `EMBEDDED_ON_AMAZON` in `extension/popup.js`). Don't undo this.

3. **No fabricated credentials.** PA-API access/secret keys must be set by the owner via Vercel environment variables. If credentials are missing, `searchAmazon()` throws a loud error — agents should surface this to the owner, not paper over it with fallback data.

4. **No widening of extension permissions** without explicit owner approval. Host permissions are scoped to `https://www.amazon.com/s*` — search pages only. Do not add product pages, cart pages, or other Amazon paths.

## Architecture

- **Framework:** Next.js 15 (App Router, React 19, TypeScript 5)
- **Database:** Supabase (shared with the rest of Chaim's portfolio) — tables: `pf_search_logs`, `pf_error_logs`, `pf_paapi_cache`
- **AI:** Google Gemini 2.5 Flash Lite via `ai` SDK for ranking
- **Product data:** Amazon PA-API 5.0 via `amazon-paapi` wrapper (sole source of truth)
- **Hosting:** Vercel (Pro plan — all cron jobs go via cron-job.org per portfolio standard, never `vercel.json` crons)

## Key Paths

| Path | Purpose |
|------|---------|
| `src/app/api/search/route.ts` | The only dynamic endpoint. AI + PA-API enrichment. 25s max duration, 10 req/min/IP rate limit. |
| `src/lib/amazon-paapi.ts` | PA-API client, 24h Supabase cache, 1 TPS rate limiter, 2s retry on 429. |
| `src/lib/amazon-lookup.legacy.ts` | Deprecated scraper — throws at import unless `AMAZON_ALLOW_SCRAPE=1`. |
| `src/lib/analytics.ts` | Fire-and-forget logging to `pf_search_logs` / `pf_error_logs`. |
| `extension/` | Chrome extension (production). Scoped to `amazon.com/s*`. |
| `archive/extension-old/` | Former `purefind-extension/` dir. Superseded; do not load. |
| `supabase/migrations/20260417_paapi_cache.sql` | PA-API response cache schema. |
| `docs/amazon-paapi-setup.md` | Step-by-step PA-API credential provisioning. |
| `src/app/privacy/page.tsx` | Must stay truthful — the extension DOES run a content script. |

## Content Rules (if you ever build editorial reviews)

- Always include honest cons — credibility > commissions
- Affiliate links must use `rel="nofollow sponsored"` (Google requirement)
- Every page must include affiliate disclosure
- Never show static prices — they must be from PA-API with `last_price_check` timestamp visible
- Never write a review for a product without PA-API data

## Self-Annealing Rules

1. If PA-API throws with "PA-API not configured" → the owner must set env vars; do NOT re-enable the scraper
2. If PA-API throws with 429/throttle repeatedly → reduce traffic, extend cache TTL; don't bypass rate limit
3. If a review update hurts rankings → revert and note the learning in commit history
4. Scripts should be deterministic; agents handle decision-making

## File Organization

| Path | Purpose |
|------|---------|
| `src/` | Next.js site code |
| `extension/` | Chrome extension (one canonical copy) |
| `archive/` | Retired code — never load or run |
| `supabase/` | Database schema + migrations |
| `directives/` | See `directives/README.md` (was empty scaffolding, now just a README) |
| `docs/` | Business strategy, PA-API setup |
| `.env.local` | API keys and secrets (gitignored) |
| `.env.example` | Template; the source of truth for required env vars |
