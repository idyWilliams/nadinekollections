-- This migration fixes missing schema elements that exist in migration files but weren't applied to the live database
-- Run this once to sync your database with the expected schema

-- 1. Add deleted_at column to profiles table for soft delete functionality
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add is_active column for banning/deactivating users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster queries on deleted users
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);

-- Create index for faster queries on active users
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Add promotion_id to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL;

-- 2. Create store_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_name TEXT DEFAULT 'NadineKollections',
  support_email TEXT,
  currency TEXT DEFAULT 'NGN',
  social_links JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add payment provider columns (from 20251214000000_add_payment_settings.sql)
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'paystack';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS paystack_public_key TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS flutterwave_public_key TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS monnify_public_key TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS monnify_contract_code TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS remita_public_key TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS remita_merchant_id TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS remita_service_type_id TEXT;

-- Enable RLS on store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.store_settings;

-- Only admins can view and update settings
CREATE POLICY "Admins can view settings" ON public.store_settings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update settings" ON public.store_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert default row if not exists
INSERT INTO public.store_settings (store_name, currency)
SELECT 'NadineKollections', 'NGN'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- 3. Update notification policies to check for deleted_at
DROP POLICY IF EXISTS "Active admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Active non-deleted admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Active admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Active non-deleted admins can insert notifications" ON public.notifications;

-- Recreate policies with deleted_at check
CREATE POLICY "Active non-deleted admins can view all notifications"
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
