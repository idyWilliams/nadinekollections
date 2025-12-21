-- Add promotion_id column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES public.promotions(id);
