-- Add deleted_at column to profiles table for soft delete
alter table profiles add column if not exists deleted_at timestamp with time zone;

-- Create index for faster queries
create index if not exists idx_profiles_deleted_at on profiles(deleted_at);

-- Update RLS policies to exclude deleted users
drop policy if exists "Active admins can view all notifications" on notifications;
drop policy if exists "Active admins can insert notifications" on notifications;

-- Recreate with deleted_at check
create policy "Active non-deleted admins can view all notifications"
  on notifications for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
        and profiles.is_active = true
        and profiles.deleted_at is null
    )
  );

create policy "Active non-deleted admins can insert notifications"
  on notifications for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
        and profiles.is_active = true
        and profiles.deleted_at is null
    )
  );
