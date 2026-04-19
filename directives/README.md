# Directives — What Actually Exists

The former scaffolding here (`auto-improve.md`, `product-research.md`, `content-repurposer.md`, `seo-optimization.md`) described an editorial-review site that was never built. It was removed during the April 2026 PA-API migration to stop giving agents a false map of the product.

PureFind as it actually exists today is:

1. **A single-page AI search** (`src/app/page.tsx`) — user types a query, Gemini 2.5 Flash returns 6-8 ranked picks, PA-API 5.0 verifies each one with a real price, image, rating, and ASIN.
2. **A Chrome extension** (`extension/`) — injects a widget onto `amazon.com/s*` pages only. Clicking a result from within an Amazon tab strips the affiliate tag (no self-referral).
3. **A 24h Supabase cache on PA-API responses** (`pf_paapi_cache` table) — keeps us under PA-API's 1 TPS throttle during traffic spikes.

There is no editorial review-site, no `/products/[slug]` pages, no comparison pages, no auto-research cycle. If we ever build those, this README should be rewritten — not re-scaffolded with aspirational SOPs.

See `AGENTS.md` (project root) for agent operating rules, and `docs/amazon-paapi-setup.md` for PA-API credential provisioning.
