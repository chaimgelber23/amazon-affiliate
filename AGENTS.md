# Agent Instructions — PureFind

> This file loads in any AI environment (Claude Code, Antigravity, Cursor, etc.).
> For Claude-specific routing see `CLAUDE.md`.

## Ground Truth

PureFind is:

- A Next.js 15 single-page AI product search at `purefind.vercel.app`
- A paused Chrome extension (`extension/`) that should stay out of the approval path
- A 1-hour Supabase cache on official Amazon product API responses

Nothing else is built. If an agent's plan refers to "editorial review pages", "slugged product pages", "comparison pages", or a "self-improvement loop" — the plan is out of date. Those were scaffolded in early design docs and never shipped. See `directives/README.md`.

## Non-Negotiables (regulatory-grade)

1. **No scraping Amazon.** The Associates Operating Agreement §5 forbids screen-scraping or data-mining Amazon. Violations = permanent Associates ban = business dead. Product data comes from Amazon's official APIs only (`src/lib/amazon-paapi.ts`: Creators API preferred, PA-API fallback). Do not reintroduce scraper code or set `AMAZON_ALLOW_SCRAPE=1` in production.

2. **No self-referrals.** Operating Agreement §6 prohibits affiliate-tagged links FROM Amazon properties. The Chrome extension is paused for approval. If it ever returns, it must strip affiliate tags when embedded on amazon.com.

3. **No fabricated credentials.** Creators API credentials or legacy PA-API keys must be set by the owner via Vercel environment variables. If credentials are missing, agents should surface this to the owner, not paper over it with scraped data.

4. **No widening of extension permissions** without explicit owner approval. The extension is not part of the approval-facing website.

## Architecture

- **Framework:** Next.js 15 (App Router, React 19, TypeScript 5)
- **Database:** Supabase (shared with the rest of Chaim's portfolio) — tables: `pf_search_logs`, `pf_error_logs`, `pf_paapi_cache`
- **AI:** Google Gemini 2.5 Pro with Flash fallback via `ai` SDK for ranking
- **Product data:** Amazon Creators API preferred; legacy PA-API 5.0 fallback (official Amazon APIs only)
- **Hosting:** Vercel (Pro plan — all cron jobs go via cron-job.org per portfolio standard, never `vercel.json` crons)

## Key Paths

| Path | Purpose |
|------|---------|
| `src/app/api/search/route.ts` | The only dynamic endpoint. AI + official Amazon product-data enrichment. 60s max duration, 10 req/min/IP rate limit. |
| `src/lib/amazon-paapi.ts` | Official Amazon product API client: Creators API preferred, PA-API fallback, 1-hour Supabase cache, 1 TPS rate limiter, 2s retry on 429. |
| `src/app/api/image/route.ts` | Disabled image-scraping route; returns 404 so Amazon images only come from official APIs. |
| `src/lib/analytics.ts` | Fire-and-forget logging to `pf_search_logs` / `pf_error_logs`. |
| `extension/` | Paused Chrome extension. Do not promote or publish during Associates approval. |
| `archive/extension-old/` | Former `purefind-extension/` dir. Superseded; do not load. |
| `supabase/migrations/20260417_paapi_cache.sql` | Official Amazon product API response cache schema. |
| `docs/amazon-paapi-setup.md` | Step-by-step Creators API / legacy PA-API credential provisioning. |
| `src/app/privacy/page.tsx` | Must stay truthful about product data, cache behavior, and extension status. |

## Content Rules (if you ever build editorial reviews)

- Always include honest cons — credibility > commissions
- Affiliate links must use `rel="nofollow sponsored"` (Google requirement)
- Every page must include affiliate disclosure
- Never show static prices — they must be from Amazon's official product API with a visible search/fetch timestamp
- Never write a review for a product without official Amazon product data and original analysis

## Self-Annealing Rules

1. If the official Amazon API is not configured → the owner must set Creators API or legacy PA-API env vars; do NOT re-enable the scraper
2. If Amazon API throws with 429/throttle repeatedly → reduce traffic and request volume; don't bypass rate limits
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
| `docs/` | Business strategy, Amazon product API setup |
| `.env.local` | API keys and secrets (gitignored) |
| `.env.example` | Template; the source of truth for required env vars |
