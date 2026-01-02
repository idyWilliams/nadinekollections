-- Enable RLS on promotions (if not already enabled)
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- 1. Policies for Admins (Full Management)
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
CREATE POLICY "Admins can manage promotions" ON public.promotions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Policies for Public/Customers (Read Only for Active Promotions)
-- This is useful for validation or displaying active promos
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
CREATE POLICY "Public can view active promotions" ON public.promotions
  FOR SELECT
  USING (is_active = true);
