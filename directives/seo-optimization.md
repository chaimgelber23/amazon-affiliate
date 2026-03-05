# SEO Optimization Directive

## Goal
Monitor and improve SEO rankings for all product review pages. Run bi-weekly.

## Process

### Step 1: Check Current Rankings
For each published review, check Google ranking for:
- Primary keyword: "[product name] review"
- Secondary: "best [category] [year]"
- Long-tail: "[product] vs [competitor]"

Use Google Search Console data or manual searches.

### Step 2: Analyze Underperforming Pages
Pages ranking below position 10 need attention. Common fixes:

| Problem | Fix |
|---------|-----|
| Thin content (under 800 words) | Add more detail, testing results, comparisons |
| Missing structured data | Add Product + Review schema markup |
| Poor title tag | Rewrite to include target keyword + year |
| No internal links | Add links from related category/review pages |
| Slow page load | Optimize images, remove unnecessary JS |
| No backlinks | Outreach: guest post, HARO, Reddit |

### Step 3: Update Pages
For each fix:
1. Make the change
2. Request re-indexing in Google Search Console
3. Log the change in `seo_rankings` table
4. Check again in 2 weeks

### Step 4: Expand Keyword Coverage
Find new keywords to target:
- Google "People Also Ask" boxes related to your reviews
- Amazon autocomplete suggestions
- Competitor review sites' keywords (use free tools like Ubersuggest)

For each new keyword, decide:
- **New page needed?** → Create a dedicated review or comparison page
- **Existing page update?** → Add a section addressing the keyword

### Step 5: Technical SEO Audit
Monthly check:
- [ ] All pages return 200 status codes
- [ ] No broken internal links
- [ ] Sitemap is up to date
- [ ] Images have alt text
- [ ] Core Web Vitals passing (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Mobile-friendly test passing
- [ ] Canonical URLs set correctly

## Self-Annealing
If a title change causes a ranking DROP, revert within 48 hours and note the original title was better. Update this directive with the learning.

## Tools
- Google Search Console (free)
- Google Analytics (free)
- Ubersuggest (free tier)
- PageSpeed Insights (free)
