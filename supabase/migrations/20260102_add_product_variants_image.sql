-- Add image_url to product_variants table
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update RLS policies to ensure variants are accessible
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Allow public read access to variants
DROP POLICY IF EXISTS "Public can view variants" ON public.product_variants;
CREATE POLICY "Public can view variants"
ON public.product_variants FOR SELECT
USING (true);

-- Allow admins to manage variants
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;
CREATE POLICY "Admins can manage variants"
ON public.product_variants FOR ALL
USING (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  )
);
