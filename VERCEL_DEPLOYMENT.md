# Vercel Deployment Guide

## Issue
The build is failing with:
```
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

This means environment variables are not configured in Vercel.

## Solution: Add Environment Variables to Vercel

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Select your project: **nadinekollections**
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Required Environment Variables

Add the following variables (copy from your `.env.local` file):

#### Required for All Environments (Production, Preview, Development):

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anon/public key
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key (keep secret!)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

4. **RESEND_API_KEY**
   - Value: Your Resend API key (e.g., `re_xxxxx`)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

5. **PAYSTACK_SECRET_KEY**
   - Value: Your Paystack secret key
   - Environments: ✅ Production, ✅ Preview, ✅ Development

6. **PAYSTACK_WEBHOOK_SECRET**
   - Value: Your Paystack webhook secret
   - Environments: ✅ Production, ✅ Preview, ✅ Development

7. **NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY**
   - Value: Your Paystack public key
   - Environments: ✅ Production, ✅ Preview, ✅ Development

8. **NEXT_PUBLIC_SITE_URL**
   - Value: `https://nadinekollections.vercel.app` (or your custom domain)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

9. **GOOGLE_GENERATIVE_AI_API_KEY**
   - Value: Your Google AI API key
   - Environments: ✅ Production, ✅ Preview, ✅ Development

### Step 3: Redeploy

After adding all environment variables:
1. Go to **Deployments** tab
2. Click on the latest failed deployment
3. Click **Redeploy** button
4. Or push a new commit to trigger automatic deployment

## Local Development Fix

If you're experiencing issues with `yarn dev`, run:
```bash
rm -rf .next
yarn dev
```

This clears the Next.js cache and should resolve the module not found errors.

## Verification

After successful deployment:
1. Visit your deployed site
2. Test login functionality
3. Test notification system
4. Verify admin settings work

## Troubleshooting

### If build still fails:
- Double-check all environment variable names (they're case-sensitive)
- Ensure no trailing spaces in values
- Verify Supabase keys are correct

### If notifications don't work:
- Check Resend API key is valid
- Verify email domain is configured in Resend dashboard

### If Paystack doesn't work:
- Ensure you're using the correct keys (test vs live)
- Verify webhook URL is set in Paystack dashboard
