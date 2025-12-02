-- Add seo_meta column for SEO fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_meta JSONB DEFAULT '{}';

-- Add tags column for product tagging
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
