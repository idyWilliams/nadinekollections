-- Add RLS policies for order_items
-- Allow anyone to insert order items (needed for guest checkout)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.order_items;
CREATE POLICY "Enable insert for all users" ON public.order_items FOR INSERT WITH CHECK (true);

-- Allow users to view their own order items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR orders.guest_email IS NOT NULL)
  )
);

-- Allow admins to manage all order items
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
