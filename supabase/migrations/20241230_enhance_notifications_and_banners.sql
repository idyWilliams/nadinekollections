-- Enhance Notifications RLS for regular users
-- Allow authenticated users to see system-wide notifications (where user_id is NULL)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own and system-wide notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Ensure Banners RLS is correct
-- Public can view active banners
DROP POLICY IF EXISTS "Public can view active banner ads" ON banner_ads;
CREATE POLICY "Public can view active banner ads"
  ON banner_ads FOR SELECT
  USING (is_active = true);

-- Admins can manage all banners
DROP POLICY IF EXISTS "Admins can manage banner ads" ON banner_ads;
CREATE POLICY "Admins can manage banner ads"
  ON banner_ads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Enable Realtime for banners (optional but nice)
ALTER PUBLICATION supabase_realtime ADD TABLE banner_ads;
