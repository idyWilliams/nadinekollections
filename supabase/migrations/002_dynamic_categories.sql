-- ============================================================
-- NADINE KOLLECTIONS — Migration 002
-- Dynamic Categories Management Table (replaces hardcoded
-- TOP_LEVEL_CATEGORIES / SUB_CATEGORIES / CATEGORY_GROUPS
-- in ProductForm.tsx & ProductFilters.tsx)
--
-- Admin can add/edit/reorder/toggle/delete categories from
-- the new Admin > Categories panel.
-- ============================================================

-- 1. Categories table (source of truth for category UX)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    group_name TEXT NOT NULL DEFAULT 'Product Type',
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_top_level BOOLEAN DEFAULT false,
    icon TEXT,
    banner_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_group ON public.categories(group_name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_top_level ON public.categories(is_top_level);

-- 2. Auto-updated `updated_at` trigger
CREATE OR REPLACE FUNCTION public.set_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.set_categories_updated_at();

-- ============================================================
-- 3. Seed — every hardcoded category from ProductForm's
--    existing taxonomy (so existing products still match &
--    the admin panel already has the recommended starter set).
-- ============================================================

INSERT INTO public.categories (name, slug, group_name, is_top_level, display_order, is_active) VALUES
  -- Audience (top-level buckets used in URL routes /shop/<slug>)
  ('Women',        'women',        'Audience',         true,  1, true),
  ('Men',          'men',          'Audience',         true,  2, true),
  ('Kids',         'kids',         'Audience',         true,  3, true),
  ('Teens',        'teens',        'Audience',         true,  4, true),
  ('Girls',        'girls',        'Audience',         false, 5, true),
  ('Boys',         'boys',         'Audience',         false, 6, true),
  -- Additional top-level (route-style buckets)
  ('Accessories',  'accessories',  'Audience',         true,  7, true),
  ('Gadgets',      'gadgets',      'Audience',         true,  8, true),
  ('Beauty',       'beauty',       'Audience',         true,  9, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, slug, group_name, is_top_level, display_order, is_active) VALUES
  -- Product Type (major customer-facing filterable tags)
  ('Clothing',         'clothing',          'Product Type', false, 10, true),
  ('Shoes',            'shoes',             'Product Type', false, 11, true),
  ('Wigs',             'wigs',              'Product Type', false, 12, true),
  ('Bags',             'bags',              'Product Type', false, 13, true),
  ('Handbags',         'handbags',          'Product Type', false, 14, true),
  ('Purses',           'purses',            'Product Type', false, 15, true),
  ('Watches',          'watches',           'Product Type', false, 16, true),
  ('Jewelry',          'jewelry',           'Product Type', false, 17, true),
  ('Earrings',         'earrings',          'Product Type', false, 18, true),
  ('Bangles',          'bangles',           'Product Type', false, 19, true),
  ('Hosiery',          'hosiery',           'Product Type', false, 20, true),
  ('Pantyhose',        'pantyhose',         'Product Type', false, 21, true), -- Best seller!
  ('Scarves',          'scarves',           'Product Type', false, 22, true),
  ('Caps',             'caps',              'Product Type', false, 23, true),
  ('Jeans',            'jeans',             'Product Type', false, 24, true),
  ('Shirts',           'shirts',            'Product Type', false, 25, true),
  ('Suits',            'suits',             'Product Type', false, 26, true),
  ('Makeup',           'makeup',            'Product Type', false, 27, true),
  ('Makeup Brushes',   'makeup-brushes',    'Product Type', false, 28, true),
  ('Makeup Boxes',     'makeup-boxes',      'Product Type', false, 29, true),
  ('Ring Lights',      'ring-lights',       'Product Type', false, 30, true),
  ('Phone Holders',    'phone-holders',     'Product Type', false, 31, true),
  ('Cameras',          'cameras',           'Product Type', false, 32, true),
  ('Dashcams',         'dashcams',          'Product Type', false, 33, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, slug, group_name, is_top_level, display_order, is_active) VALUES
  -- Shoe Styles (user: "shoes further categorized into different forms")
  ('Pumps',    'pumps',    'Shoe Styles', false, 40, true),
  ('Heels',    'heels',    'Shoe Styles', false, 41, true),
  ('Flats',    'flats',    'Shoe Styles', false, 42, true),
  ('Loafers',  'loafers',  'Shoe Styles', false, 43, true),
  ('Palms',    'palms',    'Shoe Styles', false, 44, true),
  ('Sneakers', 'sneakers', 'Shoe Styles', false, 45, true),
  ('Sandals',  'sandals',  'Shoe Styles', false, 46, true),
  ('Boots',    'boots',    'Shoe Styles', false, 47, true),
  ('Slippers', 'slippers', 'Shoe Styles', false, 48, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, slug, group_name, is_top_level, display_order, is_active) VALUES
  -- Style / Occasion
  ('Corporate Wear', 'corporate-wear', 'Style / Occasion', false, 50, true),
  ('Leisure Wear',   'leisure-wear',   'Style / Occasion', false, 51, true),
  ('Casual Wear',    'casual-wear',    'Style / Occasion', false, 52, true),
  ('Formal Wear',    'formal-wear',    'Style / Occasion', false, 53, true),
  ('School Wear',    'school-wear',    'Style / Occasion', false, 54, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, slug, group_name, is_top_level, display_order, is_active) VALUES
  -- Niche (aviation premium line)
  ('Aviation',      'aviation',       'Niche', false, 60, true),
  ('Aviation Pins', 'aviation-pins',  'Niche', false, 61, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 4. RLS — public can read active categories;
--    admin/super_admin/manager can insert/update/delete.
-- ============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories viewable by public" ON public.categories;
CREATE POLICY "Categories viewable by public"
    ON public.categories FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
    ON public.categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('super_admin','admin','manager')
        )
    );

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
    ON public.categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('super_admin','admin','manager')
        )
    );

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
    ON public.categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('super_admin','admin','manager')
        )
    );
