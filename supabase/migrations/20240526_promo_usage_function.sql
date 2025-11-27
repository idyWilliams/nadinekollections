-- Create function to increment promo usage count
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE promotions
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql;
