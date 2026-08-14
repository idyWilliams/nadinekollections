-- ============================================================
-- NADINE KOLLECTIONS — Migration 001
-- Step 1: Dynamic brands table + brand relationship to products
--         Also seeds starter brands and initial admin-facing
--         category taxonomy (used by ProductForm dropdowns).
-- ============================================================

-- 1. Brands table (dynamic — admin can add/remove)
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Link products to brands (optional FK — products without brand OK)
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

-- 3. Preserve the products.category GIN index (already exists) but ensure
--    category column is large enough for long multi-tag arrays (it's TEXT[] so fine)

-- 4. Seed starter brands matching user's inventory description
INSERT INTO public.brands (name, slug, display_order, is_active) VALUES
    ('Piccadilly',        'piccadilly',         1,  true),
    ('Clarks',            'clarks',             2,  true),
    ('American Eagle',    'american-eagle',     3,  true),
    ('Marks & Spencer',   'marks-spencer',      4,  true),
    ('Nadine Kollections','nadine-kollections', 5,  true)
ON CONFLICT (name) DO NOTHING;

-- 5. RLS: anyone can read brands + products. Only admin role can modify brands.
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands are viewable by public" ON public.brands;
CREATE POLICY "Brands are viewable by public"
    ON public.brands FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can insert brands" ON public.brands;
CREATE POLICY "Admins can insert brands"
    ON public.brands FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('super_admin','admin','manager')
        )
    );

DROP POLICY IF EXISTS "Admins can update brands" ON public.brands;
CREATE POLICY "Admins can update brands"
    ON public.brands FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('super_admin','admin','manager')
        )
    );

DROP POLICY IF EXISTS "Admins can delete brands" ON public.brands;
CREATE POLICY "Admins can delete brands"
    ON public.brands FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('super_admin','admin','manager')
        )
    );
