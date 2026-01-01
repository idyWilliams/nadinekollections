-- Add missing column to admin_invitations if not exists
ALTER TABLE public.admin_invitations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Update the trigger to be safe and robust
CREATE OR REPLACE FUNCTION public.notify_admin_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    -- Try to send notifications (wrapped in sub-transaction)
    BEGIN
      INSERT INTO public.notifications (user_id, title, message, type)
      SELECT id, 'Admin Joined', NEW.email || ' has joined the team.', 'success'
      FROM public.profiles
      WHERE role = 'admin' AND id != NEW.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Notification failed: %', SQLERRM;
    END;

    -- Try to update invitation (wrapped in sub-transaction)
    BEGIN
      UPDATE public.admin_invitations
      SET status = 'accepted', accepted_at = NOW()
      WHERE email = NEW.email AND status = 'pending';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Invitation update failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the trigger
DROP TRIGGER IF EXISTS on_admin_profile_created ON public.profiles;
CREATE TRIGGER on_admin_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_admin_acceptance();
