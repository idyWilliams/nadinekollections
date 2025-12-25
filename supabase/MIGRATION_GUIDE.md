# Database Migration Guide

## Issue
When running `schema.sql` on an existing database, you get errors about missing columns because `CREATE TABLE IF NOT EXISTS` doesn't add new columns to existing tables.

## Solution - Run Migrations in Order

### Step 1: Add Missing Columns
Run this first to add new columns to your existing tables:

```bash
# In Supabase Dashboard SQL Editor, run:
supabase/migrations/001_add_missing_columns.sql
```

Or copy and paste this SQL:

```sql
-- Add missing columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_bulk_order BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bulk_order_details JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add missing columns to order_items table
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_title TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image TEXT;

-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
```

### Step 2: Run Full Schema
After Step 1 completes successfully, run the full schema to create indexes, triggers, and policies:

```bash
# In Supabase Dashboard SQL Editor, run:
supabase/schema.sql
```

## What Changed

**Orders Table:**
- `is_bulk_order` - Flag for bulk orders
- `bulk_order_details` - JSON metadata for bulk orders
- `customer_name` - Customer name for admin dashboard

**Order Items Table:**
- `product_title` - Product name snapshot at time of order
- `product_image` - Product image snapshot at time of order

**Products Table:**
- `stock` - Inventory quantity (if not already exists)

## Verification

After running both migrations, verify with:

```sql
-- Check orders table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
AND table_schema = 'public';

-- Check order_items table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'order_items'
AND table_schema = 'public';
```

## Notes
- All migrations use `IF NOT EXISTS` so they're safe to run multiple times
- Existing data won't be affected
- New columns have sensible defaults
