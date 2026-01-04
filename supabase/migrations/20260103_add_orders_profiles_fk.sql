-- Add Foreign Key to link orders.user_id to profiles.id
-- This enables PostgREST to detect the relationship for joins (e.g., orders(*, profiles(*)))

DO $$
BEGIN
  -- Only add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_user_id_profiles_fk'
  ) THEN
    ALTER TABLE public.orders
    ADD CONSTRAINT orders_user_id_profiles_fk
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
  END IF;
END $$;
