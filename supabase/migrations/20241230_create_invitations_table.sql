-- Create admin_invitations table if not exists
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  token TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for admin_invitations
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all invitations" ON public.admin_invitations;
CREATE POLICY "Admins can view all invitations" ON public.admin_invitations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can create invitations" ON public.admin_invitations;
CREATE POLICY "Admins can create invitations" ON public.admin_invitations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update invitations" ON public.admin_invitations;
CREATE POLICY "Admins can update invitations" ON public.admin_invitations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_admin_invitations_status ON public.admin_invitations(status) WHERE status = 'pending';
