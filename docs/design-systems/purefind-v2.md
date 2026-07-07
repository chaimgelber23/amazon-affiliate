# PureFind Design System v2

Locked 2026-05-04. Routed through the Pristine Site internal-client pipeline (`pristine-internal-client` skill). Anchor preset: **Stripe Precision** (gradient mesh that feels alive, soft color pools, warm white surfaces, code-precision layout with human warmth) with the hero direction tilted to **organic & flowing** per Chaim's call.

## Palette

Core surfaces — warm cream, never cold slate.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#FAF7F2` | Page background |
| `--color-bg-warm` | `#F5EFE6` | Section backgrounds, image card surfaces |
| `--color-bg-card-solid` | `#FFFDFA` | Product cards, search input, modal surfaces |
| `--color-bg-elevated` | `#F0E9DD` | Mild elevation, pill backgrounds, empty stars |
| `--color-bg-hover` | `#E8DFD0` | Hover state for elevated surfaces |
| `--color-ink` | `#1A0F08` | Primary text |
| `--color-ink-muted` | `#4A3D34` | Secondary text |
| `--color-ink-dim` | `#8A7B6E` | Captions, footnotes |

Brand gradient — organic shift cool→warm, distinct from Amazon orange.

| Token | Value | Use |
|---|---|---|
| `--color-plum` | `#5B21B6` | Primary brand, refinement affordances, primary CTA gradient start |
| `--color-plum-deep` | `#4C1D95` | Hover states |
| `--color-rose` | `#E11D48` | Editorial accents, brand gradient end, eyebrow rules |
| `--color-rose-deep` | `#BE123C` | Compare-table cons, danger |
| `--color-amber` | `#D97706` | Single-use highlight (rarely) |
| `--color-accent-gradient` | `linear-gradient(135deg, #5B21B6 0%, #E11D48 100%)` | btn-primary, search-bar focus glow, dark-section radial pools |

CTAs preserved for Amazon recognizability.

| Token | Value | Use |
|---|---|---|
| `--color-amazon` | `#FF9900` | Amazon orange (CTA, never used elsewhere) |
| `--color-amazon-gradient` | `linear-gradient(135deg, #FF9900 0%, #FFB03A 100%)` | btn-amazon |

Semantic.

| Token | Value | Use |
|---|---|---|
| `--color-success` | `#047857` | Live data badge, pros |
| `--color-warning` | `#B45309` | Premium tier badge |
| `--color-danger` | `#BE123C` | Error states |

## Typography

Variable fonts — Fraunces for display (organic SOFT axis = literally what the brand is), Inter for body, JetBrains Mono for numerals.

```ts
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

const fraunces = Fraunces({ axes: ["SOFT", "WONK", "opsz"], variable: "--font-display" });
const inter = Inter({ variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono" });
```

Display headlines apply the variable axes:

```css
font-variation-settings: "SOFT" 50, "WONK" 0, "opsz" 144;
letter-spacing: -0.035em;
font-weight: 500;  /* not 700+ — Fraunces at medium reads premium */
```

## Hero — organic loop

`src/components/HeroOrganicLoop.tsx`. Pure CSS + SVG, no Three.js, no video file.

Concept: chaotic field of abstract blobs (Amazon's noise) → focal cluster (the curated shortlist) → scatter back. The metaphor IS the motion.

Implementation:
- 12 particles with per-particle `--blob-x-from / -to`, `--blob-scale-from / -to`, `--blob-op-from / -to` CSS variables
- `animation: blob-converge {duration}s cubic-bezier(0.45, 0.05, 0.35, 0.95) {delay}s infinite alternate`
- SVG `<filter id="hero-goo">` with `feGaussianBlur` + `feColorMatrix` so adjacent blobs merge into one organic mass when they overlap
- 3 large background blobs using `blob-drift-a/b/c` keyframes for ambient depth
- Motion-reduce fallback: degrade to the converged still frame so the metaphor still reads

## Background ambient

Page-wide soft gradient pools (in `globals.css` `body`):

```css
background-image:
  radial-gradient(ellipse 70% 50% at 18% 12%, rgba(91, 33, 182, 0.10) 0%, transparent 60%),
  radial-gradient(ellipse 60% 45% at 85% 18%, rgba(225, 29, 72, 0.08) 0%, transparent 65%),
  radial-gradient(ellipse 70% 50% at 90% 85%, rgba(217, 119, 6, 0.07) 0%, transparent 60%),
  radial-gradient(ellipse 60% 50% at 10% 92%, rgba(91, 33, 182, 0.06) 0%, transparent 60%);
```

Replaced the old indigo→purple→pink mesh-orb stack (the "AI tell").

## Search refinement

Server: detects `priorProducts` in request body → branches system prompt → instructs Gemini to filter the prior list by the new constraint instead of running a fresh search. See `src/app/api/search/route.ts:141` (`buildRefinementSystemPrompt`).

Client: `SearchBox.tsx` tracks `originalQuery` + `refinementChain` separately, sends `{ messages, priorProducts, originalQuery }` on refinement, renders a breadcrumb chain above the input showing the narrowing path.

UX affordances:
- "Narrowing N picks" eyebrow when in refinement mode
- Search-bar gets a 2px plum/30 border + small magnifier glyph on the left
- Button text morphs: "Find the pick" → "Narrow it"
- "Start a fresh search" link clears originalQuery, refinementChain, results, compareSet

## Comparison table

`src/components/CompareTable.tsx`. The "$10K differentiator" — visitors pick 2-3 cards via the per-card "Compare" toggle, get a side-by-side table aligning price / rating / why / pros / cons / CTA.

- Renders only when ≥2 selected
- Cap at 3 columns (mobile-readable)
- Tier badge per card (`budget` / `mid` / `premium`) sourced from the AI's new `tier` field
- Pros and cons rows pad with em-dash for missing entries so columns stay aligned

## Editorial Trending Products

`src/components/TrendingProducts.tsx`. Server-rendered for compliance (Amazon Associates wants curated specific products visible on landing). Magazine layout — 1 featured (lg:col-span-2 lg:row-span-2) + 5 secondary cards.

Each card has:
- Image area (16:10 featured, 4:3 secondary) — official Amazon product image, falls back to placeholder
- "Editor's take" — Wirecutter-style hand-written one-liner
- Category blurb
- Affiliate-link CTA

Official Amazon product API fallback preserved: if creds are missing or API calls error, falls back to search-link cards (still affiliate-tagged).

## Component contracts changed

`Product` interface in `SearchBox.tsx` and `CompareTable.tsx` now includes:
- `tier?: "budget" | "mid" | "premium"` — sourced from the upgraded AI prompt's "Span price tiers" rule
- `confidence?: "high" | "medium" | "low"` — sourced from the new calibrated-overconfidence rule

API route (`/api/search`) accepts both shapes:
- Legacy: `{ messages: [...] }` — fresh-search behavior
- New: `{ messages: [...], priorProducts: [...], originalQuery: "..." }` — refinement behavior

## Compliance — Amazon Associates

All 18 points from `/amazon-associates-compliance-audit` pass code-side as of this rebuild. Specifically reinforced:

- Disclosure exact phrase appears **above the search bar** (page.tsx:104), above results (SearchBox.tsx:367), in TrendingProducts masthead (216), and in footer (Footer.tsx:11)
- No misleading AI claims (greps for "return rate", "expert curation", "review pattern", "price history", "verified seller" all return zero)
- No hero product imagery (Chaim's call) — replaced with abstract organic loop, no compliance risk on demo content labeling
- Official Amazon price-bearing content cache stays 30min at the page level (`revalidate = 1800`), under the 1h ceiling
- Legacy scraper path removed; Amazon product content must come from official APIs only

## File map

| File | Role |
|---|---|
| `src/app/layout.tsx` | Loads Fraunces + Inter + JetBrains Mono via `next/font/google` |
| `src/app/globals.css` | Palette tokens, brand gradient, blob keyframes, button styles |
| `src/app/page.tsx` | Hero w/ HeroOrganicLoop, 3-step explainer, Trending, Chrome CTA |
| `src/app/api/search/route.ts` | Refinement branch + prior-products coercion + AI cache |
| `src/components/HeroOrganicLoop.tsx` | The signature visual |
| `src/components/SearchBox.tsx` | Refinement UX + compare toggles |
| `src/components/CompareTable.tsx` | Side-by-side comparison view |
| `src/components/TrendingProducts.tsx` | Editorial Wirecutter-style curation |
| `src/components/Header.tsx` | Reskinned to new palette |
| `src/components/Footer.tsx` | Reskinned, disclosure phrase preserved |
| `supabase/migrations/20260504_ai_cache.sql` | `pf_ai_cache` table for the new server-side AI cache |

## How to extend

When adding new pages or components:
- Use `text-[var(--color-ink)]` / `text-[var(--color-ink-muted)]` / `text-[var(--color-ink-dim)]` — never hardcode `text-slate-900` etc.
- Use `bg-[var(--color-bg-card-solid)]` for surfaces, `bg-[var(--color-bg-warm)]` for section backgrounds
- Section eyebrows use `text-[var(--color-rose)]` with letter-spacing `[0.22em]` and a 5px-wide horizontal line glyph: `<span className="w-5 h-px bg-[var(--color-rose)]" />`
- Display headlines: `font-display font-medium tracking-[-0.035em]` + `style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 144' }}`
- Numbers always use `font-mono tnum`
- Affiliate disclosure phrase MUST be exact: "As an Amazon Associate we earn from qualifying purchases" — never paraphrase
