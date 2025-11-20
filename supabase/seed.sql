-- Insert Super Admin (You must create this user in Auth first or update the ID)
-- Note: In a real scenario, we'd link this to an existing Auth User ID.
-- For now, we'll assume the user will update this ID after signing up.

-- Insert Shipping Zones
INSERT INTO public.shipping_zones (name, countries, shipping_method, flat_rate, estimated_delivery_days)
VALUES
('Lagos', ARRAY['Nigeria'], 'flat_rate', 1500, 2),
('Abuja', ARRAY['Nigeria'], 'flat_rate', 2500, 3),
('Nationwide', ARRAY['Nigeria'], 'flat_rate', 3500, 5);

-- Insert Promotions
INSERT INTO public.promotions (name, promo_type, discount_value, coupon_code, start_date, end_date)
VALUES
('Welcome Offer', 'percentage_off', 10, 'WELCOME10', NOW(), NOW() + INTERVAL '1 year'),
('Free Shipping', 'free_shipping', 0, 'FREESHIP', NOW(), NOW() + INTERVAL '1 month');

-- Insert Banner Ads
INSERT INTO public.banner_ads (title, subtitle, image_url, cta_text, cta_link, display_order)
VALUES
('Adorable Styles for Little Ones', 'Kids Collection', '/banners/kids.png', 'Shop Kids', '/shop/kids', 1),
('Timeless Elegance', 'Women''s Fashion', '/banners/women.png', 'Explore Women', '/shop/women', 2),
('Refined Menswear', 'Men''s Collection', '/banners/men.png', 'Discover Men', '/shop/men', 3),
('Smart Accessories', 'Tech & Gadgets', '/banners/accessories.png', 'Shop Now', '/shop/accessories', 4);

-- Insert Products
INSERT INTO products (title, description, price, category, stock, primary_image, is_new, is_sale, sale_price)
VALUES
  ('Kids Floral Dress', 'Beautiful floral dress for summer.', 9500, 'Kids', 50, '/products/kids-1.png', true, false, null),
  ('Kids Denim Jacket', 'Stylish denim jacket for cool evenings.', 12000, 'Kids', 30, '/products/kids-1.png', false, true, 10500),
  ('Women Flashy Sequined Gown', 'Elegant gown for evening parties.', 42000, 'Women', 20, '/products/women-1.png', false, true, 35000),
  ('Women Silk Blouse', 'Premium silk blouse in ivory.', 18500, 'Women', 40, '/products/women-1.png', true, false, null),
  ('Men Casual Full Wear Set', 'Comfortable and stylish casual set.', 18000, 'Men', 35, '/products/men-1.png', false, false, null),
  ('Men Classic Suit', 'Tailored suit for formal occasions.', 85000, 'Men', 15, '/products/men-1.png', true, false, null),
  ('Magnetic Phone Holder', 'Strong magnetic holder for car.', 2500, 'Accessories', 100, '/products/accessories-1.png', true, false, null),
  ('Leather Wallet', 'Genuine leather wallet with multiple slots.', 5500, 'Accessories', 60, '/products/accessories-1.png', false, false, null),
  ('Smart LED Mood Light', 'App-controlled LED light for ambience.', 7800, 'Gadgets', 45, '/products/gadget-1.png', true, false, null),
  ('Wireless Earbuds', 'High-fidelity sound with noise cancellation.', 15000, 'Gadgets', 50, '/products/gadget-1.png', false, true, 12500);

-- Insert Products (Sample Data)
-- We need to insert products and then their variants.

-- 1. Kids Floral Dress
WITH p AS (
  INSERT INTO public.products (title, slug, description, category, price, cost_price, primary_image, is_featured)
  VALUES ('Kids Floral Dress', 'kids-floral-dress', 'Beautiful floral dress for little princesses.', ARRAY['Kids', 'Girls'], 9500, 5000, '/products/kids-1.png', true)
  RETURNING id
)
INSERT INTO public.product_variants (product_id, name, sku, attributes, inventory_count)
SELECT id, '2-3 Years', 'KFD-23Y', '{"size": "2-3Y"}'::jsonb, 5 FROM p
UNION ALL
SELECT id, '4-5 Years', 'KFD-45Y', '{"size": "4-5Y"}'::jsonb, 5 FROM p
UNION ALL
SELECT id, '6-7 Years', 'KFD-67Y', '{"size": "6-7Y"}'::jsonb, 5 FROM p;

-- 2. Girly Flashy Hair Clips
WITH p AS (
  INSERT INTO public.products (title, slug, description, category, price, cost_price, primary_image)
  VALUES ('Girly Flashy Hair Clips Pack', 'hair-clips-pack', 'Colorful hair clips set.', ARRAY['Kids', 'Accessories'], 1200, 500, '/products/kids-1.png', false)
  RETURNING id
)
INSERT INTO public.product_variants (product_id, name, sku, inventory_count)
SELECT id, 'Standard Pack', 'HCP-STD', 50 FROM p;

-- 3. Women Flashy Sequined Gown
WITH p AS (
  INSERT INTO public.products (title, slug, description, category, price, cost_price, primary_image, is_featured)
  VALUES ('Women Flashy Sequined Gown', 'sequined-gown', 'Elegant sequined gown for evening parties.', ARRAY['Women', 'Dresses'], 42000, 25000, '/products/women-1.png', true)
  RETURNING id
)
INSERT INTO public.product_variants (product_id, name, sku, attributes, inventory_count)
SELECT id, 'Small - Gold', 'WSG-S-GLD', '{"size": "S", "color": "Gold"}'::jsonb, 2 FROM p
UNION ALL
SELECT id, 'Medium - Gold', 'WSG-M-GLD', '{"size": "M", "color": "Gold"}'::jsonb, 2 FROM p
UNION ALL
SELECT id, 'Large - Gold', 'WSG-L-GLD', '{"size": "L", "color": "Gold"}'::jsonb, 2 FROM p
UNION ALL
SELECT id, 'Small - Silver', 'WSG-S-SLV', '{"size": "S", "color": "Silver"}'::jsonb, 2 FROM p;

-- 4. Men Casual Full Wear Set
WITH p AS (
  INSERT INTO public.products (title, slug, description, category, price, cost_price, primary_image, is_featured)
  VALUES ('Men Casual Full Wear Set', 'men-casual-set', 'Comfortable and stylish casual set.', ARRAY['Men', 'Casual'], 18000, 10000, '/products/men-1.png', true)
  RETURNING id
)
INSERT INTO public.product_variants (product_id, name, sku, attributes, inventory_count)
SELECT id, 'Medium', 'MCS-M', '{"size": "M"}'::jsonb, 5 FROM p
UNION ALL
SELECT id, 'Large', 'MCS-L', '{"size": "L"}'::jsonb, 5 FROM p
UNION ALL
SELECT id, 'XL', 'MCS-XL', '{"size": "XL"}'::jsonb, 5 FROM p;

-- 5. Phone Holder (Magnetic)
WITH p AS (
  INSERT INTO public.products (title, slug, description, category, price, cost_price, primary_image)
  VALUES ('Magnetic Phone Holder', 'magnetic-phone-holder', 'Strong magnetic holder for cars.', ARRAY['Accessories', 'Gadgets'], 2500, 1000, '/products/accessories-1.png', false)
  RETURNING id
)
INSERT INTO public.product_variants (product_id, name, sku, attributes, inventory_count)
SELECT id, 'Black', 'MPH-BLK', '{"color": "Black"}'::jsonb, 20 FROM p
UNION ALL
SELECT id, 'White', 'MPH-WHT', '{"color": "White"}'::jsonb, 20 FROM p;

-- 6. Smart LED Mood Light
WITH p AS (
  INSERT INTO public.products (title, slug, description, category, price, cost_price, primary_image, is_featured)
  VALUES ('Smart LED Mood Light', 'smart-led-light', 'App-controlled RGB mood light.', ARRAY['Gadgets', 'Home'], 7800, 4000, '/products/accessories-1.png', true)
  RETURNING id
)
INSERT INTO public.product_variants (product_id, name, sku, inventory_count)
SELECT id, 'Standard', 'SLL-STD', 18 FROM p;
