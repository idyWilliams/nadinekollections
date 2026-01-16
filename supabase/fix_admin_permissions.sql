
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'widorenyin0+90@gmail.com'; -- Specific email from debug output
BEGIN
  -- Get the User ID from auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', v_email;
  END IF;

  -- Upsert into profiles to ensure you exist and are an admin
  INSERT INTO public.profiles (id, email, role, is_active)
  VALUES (v_user_id, v_email, 'admin', true)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', is_active = true;

  RAISE NOTICE 'Fixed permissions for %', v_email;
END $$;
