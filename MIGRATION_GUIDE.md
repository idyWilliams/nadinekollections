# Database Migration Guide

## Prerequisites
- Access to Supabase Dashboard
- Super admin credentials (justminad@gmail.com or widorenyin0@gmail.com)

## Step 1: Run Notifications Migration

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/20240524_notifications.sql`
5. Click **Run** to execute

This creates:
- `notification_type` enum
- `notifications` table
- RLS policies for secure access
- Realtime subscription

## Step 2: Run Admin Ban Migration

1. In the same SQL Editor
2. Create another new query
3. Copy and paste the contents of `supabase/migrations/20240524_admin_ban.sql`
4. Click **Run** to execute

This adds:
- `is_active` column to `profiles` table
- Index for performance
- Updated RLS policies to check active status

## Step 3: Verify Migrations

Run this query to verify:
```sql
-- Check notifications table
SELECT * FROM notifications LIMIT 1;

-- Check profiles table has is_active column
SELECT id, email, role, is_active FROM profiles WHERE role = 'admin';
```

## Step 4: Test the System

1. **Test Notifications**:
   - Create a test order
   - Check if notification appears in the bell icon
   - Verify email was sent (check Resend dashboard)

2. **Test Admin Ban**:
   - Login as super admin (justminad@gmail.com or widorenyin0@gmail.com)
   - Go to Admin Settings > Team Management
   - Try banning a non-super admin
   - Verify the admin cannot login when banned

## Troubleshooting

### If notifications table creation fails:
- Check if `profiles` table exists
- Verify you have proper permissions

### If RLS policies fail:
- Drop existing policies first:
  ```sql
  DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
  ```
- Then re-run the migration

### If is_active column fails:
- Check if column already exists:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name = 'is_active';
  ```

## Environment Variables

Ensure these are set in `.env.local`:
```
RESEND_API_KEY=re_your_api_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Super Admin Emails

Only these emails can ban/unban admins:
- justminad@gmail.com
- widorenyin0@gmail.com

These accounts cannot be banned.
