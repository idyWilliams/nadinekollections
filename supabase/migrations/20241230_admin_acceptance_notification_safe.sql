-- Safe trigger to notify admins when a new admin profile is created
CREATE OR REPLACE FUNCTION public.notify_admin_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for admin roles
  IF NEW.role = 'admin' THEN
    -- 1. Try to notify other admins
    BEGIN
      INSERT INTO public.notifications (user_id, title, message, type)
      SELECT id, 'Admin Joined', NEW.email || ' has joined the team.', 'success'
      FROM public.profiles
      WHERE role = 'admin' AND id != NEW.id;
    EXCEPTION WHEN OTHERS THEN
      -- If notification fails, don't block the profile creation
      RAISE WARNING 'Failed to send admin joining notification: %', SQLERRM;
    END;

    -- 2. Try to mark their invitation as accepted if it exists
    BEGIN
      UPDATE public.admin_invitations
      SET status = 'accepted', accepted_at = NOW()
      WHERE email = NEW.email AND status = 'pending';
    EXCEPTION WHEN OTHERS THEN
      -- If invitation update fails, don't block the profile creation
      RAISE WARNING 'Failed to update invitation status: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_admin_profile_created ON public.profiles;
CREATE TRIGGER on_admin_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_admin_acceptance();
