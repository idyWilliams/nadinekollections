-- Create notifications table
create type notification_type as enum ('info', 'success', 'warning', 'error');

create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade, -- null means system-wide notification
  type notification_type default 'info',
  title text not null,
  message text not null,
  link text,
  is_read boolean default false,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table notifications enable row level security;

-- Policies
-- Users can view their own notifications
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

-- Admins can view all notifications (including system-wide ones where user_id is null)
create policy "Admins can view all notifications"
  on notifications for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Only system/admins can insert notifications (usually done via API/Server actions)
-- But for client-side triggering (if any), we might need this.
-- For now, let's restrict insertion to service role or admins.
create policy "Admins can insert notifications"
  on notifications for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Users can update their own notifications (e.g. mark as read)
create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table notifications;
