# ProductFindAI — Monetization & Compliance Plan

_Last updated: 2026-06-22_

The goal: a compliant, near-zero-cost Amazon Associates affiliate site that earns
referral fees on genuinely good product recommendations. This doc is the roadmap
that keeps us safe (no ban) and points at how the money actually shows up.

## Where we are

- Live at **productfindai.com**. The AI search returns expert-level picks across any
  category, and the affiliate links work today (every "View/Search on Amazon" link
  carries our Associates tag).
- **PA-API is NOT connected yet.** Until it is, the site shows **no prices and no star
  ratings** — by design, for compliance (see below). It shows the products, the "why",
  and the trade-offs, and links out to Amazon to confirm the live price.

## Compliance — the rules that keep us un-banned

Amazon closes accounts for these. What we do:

- ✅ **Affiliate disclosure** present above the search bar, in results, and in the footer.
- ✅ **Links only on the website** — never in email, PDFs, ebooks, or offline.
- ✅ **Only link to product / search pages** (not help or informational pages).
- ✅ **Never ask for clicks** or incentivize them.
- ✅ **No "Amazon" in our brand or domain** — we are ProductFindAI.
- ✅ **Never show a price or star rating unless it comes live from PA-API.**
  Fixed 2026-06-22: AI-estimated prices/ratings are now hidden until `verified === true`.
  Amazon treats a guessed price/rating shown as theirs as misrepresentation — a top ban reason.
- ✅ **No false claims about data sources** — FAQ corrected to not claim live verification
  until the API is actually on.

Ongoing rules (don't break these):

- **Never buy through our own links** (no self-referral — it disqualifies the sale).
- Keep the disclosure visible on every page that carries affiliate links.
- **Never reinstate the old HTML scraper** (`amazon-lookup.legacy.ts`). Scraping Amazon
  violates the Operating Agreement §5 and is an instant ban. PA-API only.

## Getting approved — two gates

1. **Keep the Associates account:** make **3 qualifying sales within 180 days** of signup,
   or Amazon auto-closes the account.
2. **Unlock PA-API:** the current bar is **10 qualifying sales in the trailing 30 days**
   (they tightened it from the older lower threshold). It is ongoing — API rate scales
   with attributed revenue, and access can be pulled if sales dry up.

So PA-API is not a one-time unlock. It needs sustained sales (~10+/month) to stay on.

## How it makes money

- Standard Amazon Associates referral fee. **24-hour cookie, cart-wide** (we earn on
  everything the visitor buys in that window, not just the linked item).
- Commission rates are **low for our mix**: electronics/computers 1–4% (computers 1%),
  home/kitchen ~4–4.5%, toys 3%, luxury beauty up to 10%. Blended realistically **~3%**.
- Rough model, per **1,000 visitors/month**:
  1,000 visits → ~400 click to Amazon → ~7% buy → ~28 orders → ~$70 avg order →
  ~$1,960 in sales → 3% ≈ **$60/month**. So ballpark **$40–80 per 1,000 visits/month**.
- Milestones:
  - **PA-API stays on:** ~10 sales/month ≈ 400+ visits/month minimum.
  - **$500/month:** ~8,000–12,000 visits/month.
  - **$2,000/month:** ~30,000–50,000 visits/month.

Honest read: modest passive income, not quick money. Coffee money until traffic is in
the thousands/month; meaningful only at tens of thousands. Margin is high once traffic
exists (near-zero running cost), and the strong recommendation engine is the moat.

## Roadmap

- **Phase 0 — Be safe.** ✅ Done 2026-06-22 (compliance fixes shipped).
- **Phase 1 — First 3 sales** (keep the account). Publish the Chrome extension to the
  Web Store (high-intent users already on Amazon); point existing audiences at the site.
- **Phase 2 — 10 sales / 30 days** (unlock PA-API). Once the key exists, verified prices
  and ratings appear automatically — no code change needed.
- **Phase 3 — Traffic.** Buyer-intent SEO pages ("best X for Y"); the engine quality is
  what earns the ranking.
- **Phase 4 — Hold margin.** Keep the AI on a free/cheap tier (Gemini Flash). Reassess at
  ~5,000 visits/month whether to invest more in SEO/distribution.

## Risks

- Amazon controls the rates and the terms; they can cut commissions or close accounts.
- Reliability ceiling = Gemini free-tier quota (see `src/app/api/search/route.ts`); under
  real traffic this needs a paid key or Flash-primary.
- Income stays modest until traffic is in the thousands/month.
