-- Add enhanced product fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Update existing products to use images array
UPDATE products
SET images = ARRAY[primary_image] || COALESCE(gallery_images, '{}')
WHERE images IS NULL OR array_length(images, 1) IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_promotion ON products(promotion_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

COMMENT ON COLUMN products.original_price IS 'Original price before discount for price slashing display';
COMMENT ON COLUMN products.sale_price IS 'Current selling price (can be same as original if no discount)';
COMMENT ON COLUMN products.images IS 'Array of image URLs, first image is primary';
COMMENT ON COLUMN products.stock IS 'Current inventory count';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit for inventory management';
COMMENT ON COLUMN products.promotion_id IS 'Active promotion applied to this product';
