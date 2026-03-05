# Auto-Improve Directive

## Goal
Continuously improve the affiliate site's content, SEO, and conversion rate without manual intervention. Run this directive on a weekly schedule.

## Process

### Step 1: Analyze Click Data
Query the `affiliate_clicks` table to find:
- **Top clicked products** — what people are interested in
- **Low-click products** — reviews that might need better titles/images
- **Click-through rate by category** — which categories convert best

```sql
SELECT p.title, p.category, COUNT(c.id) as clicks
FROM affiliate_clicks c
JOIN products p ON c.product_id = p.id
WHERE c.clicked_at > now() - interval '7 days'
GROUP BY p.id, p.title, p.category
ORDER BY clicks DESC;
```

### Step 2: Identify Content Gaps
Search Google for your target keywords and check:
- Are you ranking on page 1? If not, the review needs more content/better SEO.
- Are competitors covering products you haven't reviewed?
- Are there new products in your categories you should cover?

### Step 3: Generate Improvement Tasks
Based on the analysis, create a prioritized list:
1. **High-click, no-review products** → Write full reviews immediately
2. **Low-ranking reviews** → Add more content, improve headlines, add internal links
3. **New trending products** → Use product-research directive to find and review
4. **Price drops detected** → Update deals page, potentially create a deal alert post

### Step 4: Update Content
For each improvement:
- Update the review content in Supabase
- Refresh the product price from Amazon
- Add new internal links between related reviews
- Update the `updated_at` timestamp (Google prefers fresh content)

### Step 5: Log Results
Record what was improved and what the metrics were before/after so the next cycle can compare.

## Self-Annealing
If a review update leads to LOWER clicks or rankings, revert the change and note what went wrong in this directive's edge cases section.

## Edge Cases
- **Product discontinued**: Mark as discontinued, remove from featured, keep the review live (it still gets search traffic)
- **Price spike**: Don't feature in deals, note the price increase in the review
- **Amazon API rate limit**: Space out API calls, cache results for 24h minimum

## Schedule
Run weekly on Sunday evenings. Can be run manually at any time.
