
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table (Public profile info for users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin', 'manager', 'support')),
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  billing_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  sale_price NUMERIC(10, 2),
  cost_price NUMERIC(10, 2), -- For admin analytics
  category TEXT[] DEFAULT '{}', -- Array of categories
  primary_image TEXT,
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0, -- Inventory stock count
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants (for sizes, colors, inventory)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Small - Red"
  sku TEXT UNIQUE,
  attributes JSONB DEFAULT '{}', -- e.g., {"size": "S", "color": "Red"}
  inventory_count INTEGER DEFAULT 0,
  price_adjustment NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT, -- For guest checkout
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  total_amount NUMERIC(10, 2) NOT NULL,
  subtotal_amount NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  shipping_address JSONB,
  billing_address JSONB,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  payment_reference TEXT, -- Paystack reference
  payment_method TEXT,
  notes TEXT,
  is_bulk_order BOOLEAN DEFAULT false,
  bulk_order_details JSONB, -- Stores bulk order metadata (quantity, pricing, etc.)
  customer_name TEXT, -- For admin dashboard display
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  title TEXT NOT NULL, -- Snapshot of product title at time of order
  product_title TEXT, -- Alias for title
  product_image TEXT, -- Snapshot of product image
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Shipping Zones
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  countries TEXT[] DEFAULT '{}',
  regions TEXT[] DEFAULT '{}',
  shipping_method TEXT DEFAULT 'flat_rate',
  flat_rate NUMERIC(10, 2) DEFAULT 0,
  estimated_delivery_days INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Promotions / Coupons
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
  value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banner Ads
CREATE TABLE IF NOT EXISTS public.banner_ads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Try On Sessions (for Analytics/History)
CREATE TABLE IF NOT EXISTS public.try_on_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_id TEXT,
  mannequin_settings JSONB,
  products JSONB,
  generated_image_url TEXT,
  prompt_used TEXT,
  engine_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Invitations (for inviting other admins)
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  resent_count INT NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications (for admin + user notifications)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.try_on_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- -------- Notifications RLS --------
DROP POLICY IF EXISTS "Users can view their own and system-wide notifications" ON public.notifications;
CREATE POLICY "Users can view their own and system-wide notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.is_active = true
        AND profiles.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Active non-deleted admins can insert notifications" ON public.notifications;
CREATE POLICY "Active non-deleted admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.is_active = true
        AND profiles.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies

-- Profiles: Users can read/update their own. Admins can read all.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Public read access to profiles (optional, usually restricted)" ON public.profiles;
CREATE POLICY "Public read access to profiles (optional, usually restricted)" ON public.profiles FOR SELECT USING (true); -- Adjusted for simplicity in this context, usually restricted.

-- Products: Public read. Admin write.
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Variants: Public read. Admin write.
DROP POLICY IF EXISTS "Public can view variants" ON public.product_variants;
CREATE POLICY "Public can view variants" ON public.product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders: Users view own. Admins view all.
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL); -- Allow guest orders (user_id null)
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Try On Sessions: Users view own. Guests view by guest_id (handled in app logic, RLS tricky for guests without auth).
-- For simplicity, we allow insert for authenticated and anon (guests).
DROP POLICY IF EXISTS "Enable insert for all users" ON public.try_on_sessions;
CREATE POLICY "Enable insert for all users" ON public.try_on_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users view own sessions" ON public.try_on_sessions;
CREATE POLICY "Users view own sessions" ON public.try_on_sessions FOR SELECT USING (auth.uid() = user_id);

-- Functions & Triggers

-- Handle New User Signup -> Create Profile
-- EXCEPTION block guarantees profile-insert failure NEVER rolls back auth.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, avatar_url, phone, is_active, deleted_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.phone,
    true,
    NULL
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user: failed to create profile for user % (%). User NOT rolled back.',
    NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Notify existing admins when an admin profile is created, and mark invitation accepted.
-- Each side-effect is wrapped in a sub-transaction so no single failure can cascade upward.
DROP TRIGGER IF EXISTS on_admin_profile_created ON public.profiles;
CREATE OR REPLACE FUNCTION public.notify_admin_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    BEGIN
      INSERT INTO public.notifications (user_id, title, message, type)
      SELECT p.id,
             'Admin Joined',
             COALESCE(NEW.email, 'A new admin') || ' has joined the team.',
             'info'::notification_type
      FROM   public.profiles p
      WHERE  p.role = 'admin'
        AND  p.id IS DISTINCT FROM NEW.id
        AND  p.is_active = true
        AND  p.deleted_at IS NULL;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_admin_acceptance: notification insert failed: %', SQLERRM;
    END;

    BEGIN
      UPDATE public.admin_invitations
      SET    status      = 'accepted',
             accepted_at = NOW()
      WHERE  email  = NEW.email
        AND  status = 'pending';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_admin_acceptance: invite update failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_admin_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_acceptance();

-- Revoke public EXECUTE on SECURITY DEFINER functions (least privilege)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admin_acceptance() FROM PUBLIC;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_banner_ads_active ON public.banner_ads(is_active, display_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_orders_is_bulk ON public.orders(is_bulk_order) WHERE is_bulk_order = true;
CREATE INDEX IF NOT EXISTS idx_admin_invitations_status ON public.admin_invitations(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_admin_invitations_last_sent_at ON public.admin_invitations(last_sent_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role = 'admin' AND is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS Policies for Admin Invitations
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.admin_invitations;
CREATE POLICY "Admins can view all invitations" ON public.admin_invitations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can create invitations" ON public.admin_invitations;
CREATE POLICY "Admins can create invitations" ON public.admin_invitations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update invitations" ON public.admin_invitations;
CREATE POLICY "Admins can update invitations" ON public.admin_invitations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Stock Management Triggers

-- Function to decrease stock when order item is created
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrease stock for paid orders
  IF EXISTS (SELECT 1 FROM orders WHERE id = NEW.order_id AND payment_status = 'paid') THEN
    UPDATE products
    SET stock = GREATEST(stock - NEW.quantity, 0)
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_item_created ON order_items;
CREATE TRIGGER on_order_item_created
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_product_stock();

-- Function to restore stock when order is cancelled/refunded
CREATE OR REPLACE FUNCTION restore_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'cancelled' OR NEW.status = 'refunded') AND
     (OLD.status != 'cancelled' AND OLD.status != 'refunded') AND
     OLD.payment_status = 'paid' THEN

    UPDATE products p
    SET stock = stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_cancelled ON orders;
CREATE TRIGGER on_order_cancelled
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_product_stock();

-- Function to update stock when payment status changes to paid
CREATE OR REPLACE FUNCTION handle_payment_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status changes from unpaid to paid, decrease stock
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    UPDATE products p
    SET stock = GREATEST(stock - oi.quantity, 0)
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_payment_confirmed ON orders;
CREATE TRIGGER on_payment_confirmed
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.payment_status IS DISTINCT FROM OLD.payment_status)
  EXECUTE FUNCTION handle_payment_confirmation();
