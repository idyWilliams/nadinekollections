-- Add is_active column to profiles table
alter table profiles add column if not exists is_active boolean default true;

-- Create index for faster queries
create index if not exists idx_profiles_is_active on profiles(is_active);

-- Update RLS policies to check is_active status
-- Drop existing admin policies if they exist
drop policy if exists "Admins can view all notifications" on notifications;
drop policy if exists "Admins can insert notifications" on notifications;

-- Recreate with is_active check
create policy "Active admins can view all notifications"
  on notifications for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
        and profiles.is_active = true
    )
  );

create policy "Active admins can insert notifications"
  on notifications for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
        and profiles.is_active = true
    )
  );
