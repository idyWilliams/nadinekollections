-- Create a new migration to handle variant-specific stock deduction
-- This updates existing triggers to work with product_variants table

-- 1. Update decrease_product_stock() to handle variants
CREATE OR REPLACE FUNCTION public.decrease_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrease stock for paid orders
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = NEW.order_id AND payment_status = 'paid') THEN
    -- Update specific variant stock if it exists
    IF NEW.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET inventory_count = GREATEST(inventory_count - NEW.quantity, 0)
      WHERE id = NEW.variant_id;
    END IF;

    -- Update main product stock (total stock)
    UPDATE public.products
    SET stock = GREATEST(stock - NEW.quantity, 0)
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Update restore_product_stock() to handle variants
CREATE OR REPLACE FUNCTION public.restore_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'cancelled' OR NEW.status = 'refunded') AND
     (OLD.status != 'cancelled' AND OLD.status != 'refunded') AND
     OLD.payment_status = 'paid' THEN

    -- Restore main product stock
    UPDATE public.products p
    SET stock = stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;

    -- Restore variant stock if present
    UPDATE public.product_variants pv
    SET inventory_count = pv.inventory_count + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.variant_id = pv.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update handle_payment_confirmation() to handle variants
CREATE OR REPLACE FUNCTION public.handle_payment_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status changes from unpaid to paid, decrease stock
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    -- Decrease main product stock
    UPDATE public.products p
    SET stock = GREATEST(stock - oi.quantity, 0)
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;

    -- Decrease variant stock
    UPDATE public.product_variants pv
    SET inventory_count = GREATEST(pv.inventory_count - oi.quantity, 0)
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.variant_id = pv.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
