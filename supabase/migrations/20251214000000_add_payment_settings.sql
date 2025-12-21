-- Add payment provider and key columns to store_settings table

ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'paystack',
ADD COLUMN IF NOT EXISTS paystack_public_key text,
ADD COLUMN IF NOT EXISTS paystack_secret_key text,
ADD COLUMN IF NOT EXISTS flutterwave_public_key text,
ADD COLUMN IF NOT EXISTS monnify_public_key text,
ADD COLUMN IF NOT EXISTS monnify_contract_code text,
ADD COLUMN IF NOT EXISTS remita_public_key text,
ADD COLUMN IF NOT EXISTS remita_merchant_id text,
ADD COLUMN IF NOT EXISTS remita_service_type_id text;

-- Add comment to explain usage
COMMENT ON COLUMN store_settings.payment_provider IS 'Active payment provider: paystack, flutterwave, monnify, remita';
