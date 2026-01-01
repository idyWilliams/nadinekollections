/**
 * Centralized configuration for the application.
 * This ensures consistency across client and server-side code.
 */

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
  paystack: {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
  },
  email: {
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@nadinekollections.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Nadine Kollections',
  }
};
