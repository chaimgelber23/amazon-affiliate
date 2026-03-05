# Product Research Directive

## Goal
Find new products worth reviewing in your target categories. Prioritize products with high search volume, good commission rates, and a gap in quality reviews.

## Inputs
- **Category**: Which product category to research
- **Budget**: Max price of products to consider
- **Quantity**: How many new products to find (default: 5)

## Process

### Step 1: Identify Trending Products
Sources to check:
1. **Amazon Best Sellers** — `amazon.com/bestsellers` in your category
2. **Amazon Movers & Shakers** — products gaining sales rank quickly
3. **Google Trends** — search volume trending up for product-related keywords
4. **Reddit** — check subreddits like r/BuyItForLife, r/homeoffice, r/cooking for what people are recommending

### Step 2: Evaluate Each Product
For each candidate, check:
- [ ] Amazon rating ≥ 4.0 with ≥ 500 reviews
- [ ] Price between $15-$300 (sweet spot for affiliate commission)
- [ ] Not already reviewed on your site
- [ ] Search volume exists for "[product name] review" (use Google autocomplete)
- [ ] No dominant competitor review ranking #1 (or you can write a better one)

### Step 3: Prioritize by Revenue Potential
Score = (estimated monthly searches) × (commission rate) × (average price) × (conversion probability)

Focus on:
- Products in **4-5% commission categories** (books, kitchen, automotive)
- Products priced **$50-$200** (high enough for meaningful commission)
- Keywords with **"best X for Y" format** (highest conversion intent)

### Step 4: Create Product Entries
For approved products, create entries in the `products` table with:
- ASIN from Amazon
- Affiliate URL (auto-generated from ASIN)
- Category assignment
- Draft status (not featured until review is written)

### Step 5: Queue Review Drafts
Create entries in `content_drafts` table with:
- Product ID
- Draft type: "review"
- Status: "draft"
- Initial content: AI-generated first draft (use Anthropic API)

The draft should include:
- Product description (from Amazon, rewritten in our voice)
- Feature list
- Suggested pros/cons (from Amazon review analysis)
- Comparison context (what else exists in this price range)

## Output
- New product entries in Supabase
- Review drafts ready for human editing and approval

## Edge Cases
- **Product out of stock**: Skip, flag for re-check in 2 weeks
- **Product too niche**: Only review if monthly search volume > 500
- **Product has no competition**: Great — easy to rank, low priority if search volume is also low
