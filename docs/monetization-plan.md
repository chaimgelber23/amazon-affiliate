# ProductFindAI - Monetization & Compliance Plan

_Last updated: 2026-07-07_

The goal: a compliant, near-zero-cost Amazon Associates affiliate site that earns
referral fees on useful product recommendations. This doc keeps the approval path
safe and points at how the money actually shows up.

## Where We Are

- Live at **productfindai.com**.
- The website carries Amazon Associates affiliate links.
- The Chrome extension is paused while the website completes Amazon Associates
  approval.
- Official Amazon product API access is the next unlock. The code now prefers
  Creators API credentials and keeps legacy PA-API support as a fallback.
- Until official Amazon product data is available, the site should not show
  product prices, star ratings, Amazon images, or product-specific Amazon claims.

## Compliance Rules

Amazon can close accounts for these. ProductFindAI must keep doing all of them:

- Show the exact affiliate disclosure where affiliate links appear:
  "As an Amazon Associate I earn from qualifying purchases."
- Use affiliate links only on the public website, not in email, PDFs, ebooks, or
  offline material.
- Never ask for or incentivize clicks.
- Never buy through our own links.
- Do not use "Amazon" in the brand or domain.
- Never scrape Amazon pages or extract rendered Amazon content.
- Never show an Amazon price, rating, review count, image, availability, or
  product detail unless it came from Amazon's official product API.
- Keep official Amazon product API content cached for at most 1 hour when it can
  contain price-bearing content.
- Keep the extension out of the approval path unless Amazon explicitly approves
  that surface and the implementation is re-reviewed.

## Approval Gates

1. Keep the Associates account: make the required qualifying sales within the
   initial review window.
2. Unlock official product API access: Amazon's current Creators API docs say
   at least 10 qualifying sales within the past 30 days are required.
3. Add Creators API credentials in Vercel:
   `AMAZON_CREATORS_API_CREDENTIAL_ID`,
   `AMAZON_CREATORS_API_CREDENTIAL_SECRET`,
   `AMAZON_CREATORS_API_CREDENTIAL_VERSION`,
   `AMAZON_CREATORS_API_PARTNER_TAG`,
   `AMAZON_CREATORS_API_MARKETPLACE`.

## How It Makes Money

- Standard Amazon Associates referral fees.
- Amazon controls rates, attribution windows, and program rules.
- Rough model per 1,000 visitors/month: if 40% click to Amazon, 7% buy, the
  average order is $70, and blended commission is 3%, revenue is about $60/month.
- Meaningful income needs traffic in the thousands to tens of thousands per
  month; the near-zero operating cost keeps margin high once traffic exists.

## Roadmap

- Phase 0 - Stay safe: disclosure, no scraping, no fake prices/ratings, extension
  paused.
- Phase 1 - First qualifying sales: drive users to the public website, not the
  extension.
- Phase 2 - Creators API access: add official credentials; verified product data
  appears without showing fabricated numbers.
- Phase 3 - Traffic: publish buyer-intent SEO pages only when they add original
  analysis and follow the same Amazon content rules.
- Phase 4 - Improve economics: watch AI cost, API quota, click-through rate, and
  conversion rate before adding heavier features.

## Risks

- Amazon can change rates, eligibility, API access, or account standing.
- Gemini quota can cap search reliability under real traffic.
- Affiliate revenue stays modest until the site has consistent buyer-intent
  traffic.
