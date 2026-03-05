# Agent Instructions

> This file loads in any AI environment (Claude Code, Antigravity, etc.)

You operate within a 3-layer architecture for the TopPicked Amazon Affiliate business.

## Architecture

**Layer 1: Directives** (`directives/`)
- `auto-improve.md` — Weekly self-improvement cycle: analyze clicks, find gaps, generate tasks
- `product-research.md` — Find new products to review, evaluate, and queue drafts
- `content-repurposer.md` — Turn reviews into social media content
- `seo-optimization.md` — Monitor rankings, fix underperforming pages, expand keywords

**Layer 2: Orchestration** (You)
- Read directives, execute them in order, handle errors
- Make decisions: which products to review, which improvements to prioritize
- Update directives when you learn something new (self-annealing)

**Layer 3: Execution** (`execution/` — to be built as needed)
- Deterministic Python scripts for API calls, data processing, etc.
- Will include: price checker, review draft generator, SEO auditor

## Key Context

- **Business model**: Amazon Associates affiliate — earn 1-10% commission on purchases through our links
- **Editorial angle**: Amazon sellers dump SEO into product listings, making them noisy/untrustworthy. We're the independent, honest filter.
- **Tech stack**: Next.js + Supabase + Vercel
- **Database schema**: `supabase/schema.sql`
- **Sample data**: `src/lib/products.ts` (replace with Supabase queries once connected)

## Self-Annealing Rules

1. If a directive step fails → fix the script → update the directive → resume
2. If a review update hurts rankings → revert and note the learning
3. Every error permanently improves the system
4. Scripts should be deterministic; you handle the decision-making

## Content Rules

- Never write a review for a product you haven't tested or don't have enough data on
- Always include honest cons — credibility > commissions
- Affiliate links must use `rel="nofollow sponsored"` (Google requirement)
- Every page must include affiliate disclosure
- Never show static prices — they must be current or linked to Amazon

## File Organization

| Path | Purpose |
|------|---------|
| `src/` | Next.js site code |
| `supabase/` | Database schema |
| `directives/` | SOPs for business operations |
| `execution/` | Deterministic scripts (Python) |
| `docs/` | Business strategy and guides |
| `.env.local` | API keys and secrets |
| `.tmp/` | Temporary/intermediate files |
