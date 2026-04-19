# Amazon PA-API 5.0 — Credential Setup

This guide walks through provisioning Amazon Product Advertising API (PA-API) 5.0 credentials for PureFind. These replace the old HTML scraper and are a requirement for legal operation under the Associates Operating Agreement.

---

## 0. Prerequisite — Associates Account in Good Standing

PA-API credentials are only issued to Amazon Associates accounts that:

1. Have an approved Associates account in your target locale (US = amazon.com).
2. Have generated **at least 3 qualifying sales within the last 180 days** through any of your existing associate tags. Amazon re-checks this silently — if you fall below threshold, they'll suspend your keys with a single email.

If you're below threshold, apply for PA-API access anyway; Amazon often grants a probationary key pair and will revoke if you don't hit 3 sales in the first 180 days.

---

## 1. Generate Credentials

1. Log in to https://affiliate-program.amazon.com
2. Open **Tools → Product Advertising API**, or go directly to: https://affiliate-program.amazon.com/assoc_credentials/home
3. Click **Add credentials**. Amazon will show your:
   - **Access Key** — roughly 20 chars, starts with `AKIA…`
   - **Secret Key** — shown once; copy it immediately (you can regenerate if lost, but existing keys stop working)
4. Note your **Associate Tag** (e.g. `purefind-20`). If you run multiple sites, create a separate tracking tag per site so commission attribution is clean.

---

## 2. Add to Environment

In Vercel (**Settings → Environment Variables**) add these four, Production + Preview:

| Key | Value |
|-----|-------|
| `AMAZON_PAAPI_ACCESS_KEY` | Access Key from step 1 |
| `AMAZON_PAAPI_SECRET_KEY` | Secret Key from step 1 |
| `AMAZON_PAAPI_PARTNER_TAG` | Your tracking tag (e.g. `purefind-20`) |
| `AMAZON_PAAPI_HOST` | `webservices.amazon.com` (US) |
| `AMAZON_PAAPI_REGION` | `us-east-1` |

For locales other than US see https://webservices.amazon.com/paapi5/documentation/common-request-parameters.html#host-and-region — most non-US marketplaces use a different `Host`/`Region` pair.

For local dev, mirror these into `.env.local`. `.env.example` has the full template.

---

## 3. Redeploy and Smoke-Test

```bash
# Hit the search endpoint with a known-safe query:
curl -s -X POST https://purefind.vercel.app/api/search \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"quiet mechanical keyboard"}]}' \
  | jq '.products[0]'
```

Expected: a product object with `asin`, `title`, a real `priceEstimate`, a `imageUrl` from `m.media-amazon.com`, and `verified: true`.

If you see a 503 "Product verification unavailable" response, check Vercel logs — the most likely causes are:

- Credentials not set → log will contain "PA-API not configured"
- Wrong region/host pair → log shows signed-request failure from the SDK
- Throttling (1 TPS default) → retry after 2s; persistent 429s mean your account needs more qualifying sales before Amazon raises the ceiling

---

## 4. Throttle & Cost Model

PA-API pricing summary (as of April 2026):

- **Baseline:** 1 TPS (transaction per second), 8,640 TPD (transactions per day)
- **Scaling:** each $1 in attributed revenue in the prior 30 days buys +1 TPS capacity (up to ~10 TPS) and scales TPD accordingly
- **Cost:** $0 per call — it's a free quota that expands with sales
- If you blow past TPD you get `429 TooManyRequestsException` and calls are rejected until the next UTC day rollover

PureFind's 24h Supabase cache (`pf_paapi_cache`) materially reduces call volume for repeated queries — a single popular query like "best wireless earbuds" may only hit PA-API once/day regardless of traffic.

---

## 5. Known Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| `InvalidSignature` from SDK | Clock drift > 5 min, or secret key copy-paste added whitespace | Re-copy key; `sudo sntp -sS time.apple.com` on Mac, `w32tm /resync` on Windows |
| `InvalidPartnerTag` | Using a tag that doesn't belong to the same Associates account as your access key | Generate a tag inside the same account or use the default from step 1 |
| Empty `CustomerReviews` | Some items don't expose reviews to PA-API, or your account lacks CustomerReviews resource access | Expected — the code degrades gracefully; rating/reviewCount will be `undefined` |
| PA-API deprecation notice | Amazon is migrating from PA-API to the Creators API | Track https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction — no action required until formal sunset announcement |

---

## 6. Revocation / Rotation

If a key leaks:

1. `affiliate-program.amazon.com/assoc_credentials/home` → **Deactivate** the compromised pair
2. Create a new pair
3. Update Vercel env vars (Production + Preview), redeploy
4. Remove the compromised key from any `.env.local`, git history (use `git filter-repo`), and any CI secret stores
