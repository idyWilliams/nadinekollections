-- Trigger to notify admins when a new admin profile is created (invitation accepted)
CREATE OR REPLACE FUNCTION public.notify_admin_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    -- Notify all other admins
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT id, 'Admin Joined', NEW.email || ' has joined the team.', 'success'
    FROM public.profiles
    WHERE role = 'admin' AND id != NEW.id;

    -- Also mark their invitation as accepted if it exists
    UPDATE public.admin_invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE email = NEW.email AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_admin_profile_created ON public.profiles;
CREATE TRIGGER on_admin_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_admin_acceptance();
