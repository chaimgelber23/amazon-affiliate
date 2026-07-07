# Amazon Official Product API Credential Setup

ProductFindAI must use Amazon's official product-data APIs. It must not scrape
Amazon pages, extract rendered Amazon content, or display AI-guessed Amazon
prices, ratings, images, or review counts.

The preferred integration is now the Amazon Creators API. Legacy Product
Advertising API 5.0 credentials are still supported by the code as a fallback
while older accounts migrate.

---

## 0. Prerequisite - Associates Account in Good Standing

For Creators API, Amazon's current docs say you need:

1. An Amazon Associates account that has received final acceptance.
2. Qualifying referred sales; the Creators API introduction currently says at
   least 10 qualifying sales within the past 30 days.
3. API access registered through Associates Central by the primary account owner.

Official docs:

- Creators API introduction: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction
- Register for Creators API: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/onboarding/register-for-creators-api
- Migration guide: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi

---

## 1. Generate Creators API Credentials

1. Log in to https://affiliate-program.amazon.com as the primary account owner.
2. Open Tools -> Creators API.
3. Choose Create Application.
4. Enter an application name such as `ProductFindAI`.
5. Add a credential and copy the values immediately:
   - Credential ID
   - Credential Secret
   - Version, such as `3.1` for North America v3 credentials
6. Confirm your Associate tracking tag for the US marketplace, for example
   `purefind-20`.

Creators API credentials are not the same as old PA-API AWS access keys.

---

## 2. Add to Environment

In Vercel Settings -> Environment Variables, add these for Production and
Preview:

| Key | Value |
| --- | --- |
| `AMAZON_CREATORS_API_CREDENTIAL_ID` | Credential ID from Associates Central |
| `AMAZON_CREATORS_API_CREDENTIAL_SECRET` | Credential Secret from Associates Central |
| `AMAZON_CREATORS_API_CREDENTIAL_VERSION` | Credential version, for example `3.1` |
| `AMAZON_CREATORS_API_PARTNER_TAG` | Your tracking tag, for example `purefind-20` |
| `AMAZON_CREATORS_API_MARKETPLACE` | `www.amazon.com` for the US marketplace |

For local development, mirror them into `.env.local`. `.env.example` has the
full template.

If Amazon has only issued you legacy PA-API credentials, the fallback env vars
remain supported:

| Key | Value |
| --- | --- |
| `AMAZON_PAAPI_ACCESS_KEY` | Legacy PA-API access key |
| `AMAZON_PAAPI_SECRET_KEY` | Legacy PA-API secret key |
| `AMAZON_PAAPI_PARTNER_TAG` | Your tracking tag |
| `AMAZON_PAAPI_HOST` | `webservices.amazon.com` for US |
| `AMAZON_PAAPI_REGION` | `us-east-1` for US |

---

## 3. Redeploy and Smoke-Test

```bash
curl -s -X POST https://productfindai.com/api/search \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"quiet mechanical keyboard"}]}' \
  | jq '.products[0]'
```

Expected when official Amazon data is available:

- `asin` is a real 10-character ASIN
- `verified` is `true`
- `imageUrl` is from Amazon's official API response
- `priceEstimate` is present only if Amazon returned a current offer price
- `rating` / `reviewCount` are present only if Amazon returned them

If official data is not available yet, the site should still return a shortlist,
but it should not show prices, star ratings, product images, or product-specific
Amazon claims as if they came from Amazon.

---

## 4. Cache and Token Rules

- Creators API access tokens are cached server-side until shortly before their
  1-hour expiration.
- Official Amazon product API responses are cached server-side for at most 1
  hour because price-bearing content has a strict freshness rule.
- The browser does not cache verified Amazon product result payloads in session
  storage.
- ProductFindAI does not use a service worker page cache, because caching a
  rendered homepage could retain official Amazon product content too long.

---

## 5. Known Gotchas

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Invalid Credentials` | Using legacy PA-API keys as Creators API credentials | Generate Creators API credentials from Tools -> Creators API |
| `Token Expired` | OAuth token expired after 1 hour | The code refreshes automatically; check logs if it repeats |
| `Missing Marketplace Header` | Creators API requires `x-marketplace` | Keep `AMAZON_CREATORS_API_MARKETPLACE=www.amazon.com` |
| 429 / throttling | API quota or token endpoint rate limit | Keep token caching enabled and reduce request volume |
| Missing price/rating | Amazon did not return that resource | Expected; the UI must link users to Amazon to confirm |

---

## 6. Revocation / Rotation

If a credential leaks:

1. Delete or deactivate the compromised credential in Associates Central.
2. Create a new credential.
3. Update Vercel env vars for Production and Preview.
4. Redeploy.
5. Remove the compromised value from any local `.env.local`, shell history,
   logs, and CI secret stores.
