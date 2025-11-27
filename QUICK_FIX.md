# Quick Fix: Vercel Deployment

## Problem
Build failing with: `Error: @supabase/ssr: Your project's URL and API key are required`

## Solution (5 minutes)

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select project: **nadinekollections**
- Click: **Settings** → **Environment Variables**

### 2. Add These Variables
Copy from your local `.env.local` file:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ RESEND_API_KEY
✅ PAYSTACK_SECRET_KEY
✅ PAYSTACK_WEBHOOK_SECRET
✅ NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
✅ GOOGLE_GENERATIVE_AI_API_KEY
✅ NEXT_PUBLIC_SITE_URL (use your Vercel URL)
```

**Important**: For each variable, check all three boxes:
- ✅ Production
- ✅ Preview
- ✅ Development

### 3. Redeploy
- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment

## Local Dev Server Fixed
I've cleared your `.next` cache. Run:
```bash
yarn dev
```

## Database Migrations
After deployment succeeds, run the SQL migrations:
1. Open Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/20240524_notifications.sql`
3. Run `supabase/migrations/20240524_admin_ban.sql`

See `MIGRATION_GUIDE.md` for detailed steps.
