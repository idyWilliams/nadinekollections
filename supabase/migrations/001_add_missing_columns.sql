-- Migration: Add missing columns to existing tables
-- Run this BEFORE running schema.sql on existing database

-- Add missing columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_bulk_order BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bulk_order_details JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add missing columns to order_items table
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_title TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image TEXT;

-- Add missing columns to products table (if not exists)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Now you can run the full schema.sql to create indexes, triggers, and policies
