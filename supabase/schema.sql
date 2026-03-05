-- ============================================
-- TopPicked Amazon Affiliate — Supabase Schema
-- ============================================
-- Run this in Supabase SQL Editor to create all tables.

-- Products you review/recommend
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  amazon_rating DECIMAL(2,1) DEFAULT 0,
  amazon_review_count INTEGER DEFAULT 0,
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  price_cents INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  badge TEXT,
  review_content TEXT DEFAULT '',
  -- Self-improving fields
  click_count INTEGER DEFAULT 0,
  conversion_estimate DECIMAL(5,2) DEFAULT 0,
  seo_score INTEGER DEFAULT 0,
  last_price_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  commission_rate DECIMAL(4,2) DEFAULT 0,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track affiliate link clicks (analytics)
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  asin TEXT,
  source_page TEXT,
  user_agent TEXT,
  referer TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

-- Product comparisons
CREATE TABLE IF NOT EXISTS comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  verdict TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Price history (for tracking price drops / deals)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Content drafts (for self-improving review generation)
CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  draft_type TEXT NOT NULL DEFAULT 'review', -- 'review', 'comparison', 'deal_alert'
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'approved', 'published'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SEO rankings tracking
CREATE TABLE IF NOT EXISTS seo_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL,
  keyword TEXT NOT NULL,
  position INTEGER,
  search_engine TEXT DEFAULT 'google',
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_clicks_product ON affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_clicks_time ON affiliate_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_seo_rankings_slug ON seo_rankings(product_slug);

-- ============================================
-- RLS Policies (public read, service-role write)
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read comparisons" ON comparisons FOR SELECT USING (true);

-- Insert clicks from anyone (tracked via API)
CREATE POLICY "Public insert clicks" ON affiliate_clicks FOR INSERT WITH CHECK (true);

-- ============================================
-- Auto-update timestamp trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
