-- Enable RLS (just in case)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Fix Admin View Policy
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'support')
  )
);

-- Fix Admin Update Policy (if it exists or needed)
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'support')
  )
);

-- Ensure public/users can still view their own orders (usually correct, but creating if missing)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT
USING (auth.uid() = user_id);
