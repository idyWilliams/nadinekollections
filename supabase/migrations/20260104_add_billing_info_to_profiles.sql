-- Add billing_info JSONB column to profiles table
-- This will store the latest/preferred billing address for the customer

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_info JSONB DEFAULT NULL;

-- Enable RLS for the new column (covered by existing profile policies, but just to be explicit)
-- Profiles RLS already allows users to view/update their own profiles.
