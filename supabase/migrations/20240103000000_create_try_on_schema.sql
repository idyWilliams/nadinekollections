-- Create Try-On Sessions Table
CREATE TABLE public.try_on_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id), -- Nullable for guests
  guest_id TEXT, -- Fingerprint or cookie ID for guests
  mannequin_settings JSONB NOT NULL, -- { gender, skin_tone, size, age }
  products JSONB[] NOT NULL, -- Array of product details used
  generated_image_url TEXT NOT NULL,
  prompt_used TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Try-On Shares Table
CREATE TABLE public.try_on_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.try_on_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  platform TEXT NOT NULL, -- 'whatsapp', 'instagram', 'twitter', 'download'
  shared_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.try_on_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.try_on_shares ENABLE ROW LEVEL SECURITY;

-- Policies for Sessions
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.try_on_sessions
  FOR SELECT USING (
    (auth.uid() = user_id) OR
    (auth.uid() IS NULL AND guest_id = current_setting('request.headers', true)::json->>'x-guest-id')
  );

-- Anyone can insert (for guests and users)
CREATE POLICY "Anyone can create sessions" ON public.try_on_sessions
  FOR INSERT WITH CHECK (true);

-- Policies for Shares
-- Anyone can insert shares (analytics)
CREATE POLICY "Anyone can record shares" ON public.try_on_shares
  FOR INSERT WITH CHECK (true);

-- Admins can view all for analytics
CREATE POLICY "Admins can view all sessions" ON public.try_on_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can view all shares" ON public.try_on_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager')
    )
  );
