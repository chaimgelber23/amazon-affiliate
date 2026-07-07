# Directives - What Actually Exists

The former scaffolding here (`auto-improve.md`, `product-research.md`,
`content-repurposer.md`, `seo-optimization.md`) described an editorial-review
site that was never built. It was removed during the April 2026 official Amazon
API migration to stop giving agents a false map of the product.

ProductFindAI as it actually exists today is:

1. **A single-page AI search** (`src/app/page.tsx`) - user types a query,
   Gemini returns 6-8 ranked picks, and Amazon's official product API verifies
   product data when access is available.
2. **A paused Chrome extension** (`extension/`) - not part of the
   approval-facing website.
3. **A 1-hour Supabase cache on official Amazon product API responses**
   (`pf_paapi_cache` table) - keeps product content inside Amazon's freshness
   window.

There is no editorial review site, no `/products/[slug]` pages, no comparison
pages, and no auto-research cycle. If we ever build those, this README should be
rewritten, not re-scaffolded with aspirational SOPs.

See `AGENTS.md` for agent operating rules, and `docs/amazon-paapi-setup.md` for
Creators API / legacy PA-API credential provisioning.
