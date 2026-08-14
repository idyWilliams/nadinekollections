/**
 * Centralized configuration for the application.
 * Enforces consistency across client + server, plus production safety.
 *
 * Rules:
 *  - Required NEXT_PUBLIC_* variables use `!` only after a runtime assert
 *    (see the freeze/validate block at bottom) so a missing value fails
 *    loudly at boot instead of producing silent `undefined` bugs later.
 *  - `site.url` NEVER silently falls back to localhost in
 *    NODE_ENV=production — missing env var throws. This is the #1 cause
 *    of invite-emails going out with `localhost:3000` in production.
 *  - All URLs are normalized (trimmed, no trailing slash) so callers never
 *    have to wonder if `config.site.url + "/path"` produces a double-slash.
 */

const normalizeUrl = (raw: string | undefined, fallback: string): string => {
  const value = (raw ?? fallback).trim().replace(/\/+$/, "");
  return value;
};

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

// In production, the site URL MUST be explicitly set — no localhost fallback.
// If you see the error thrown below, add NEXT_PUBLIC_SITE_URL to your
// deployment env vars (Vercel project settings → Environment Variables).
const computedSiteUrl =
  process.env.NODE_ENV === "production"
    ? (() => {
        if (!rawSiteUrl) {
          throw new Error(
            "[config] NEXT_PUBLIC_SITE_URL is required in production. " +
              "Set it to your live domain (e.g. https://www.nadinekollections.com)."
          );
        }
        if (/localhost|127\.0\.0\.1|\.local/i.test(rawSiteUrl)) {
          console.warn(
            "⚠️ [config] Warning: NEXT_PUBLIC_SITE_URL is set to localhost in a production build. This is fine for local testing, but remember to update it before live deployment!"
          );
        }
        return normalizeUrl(rawSiteUrl, "");
      })()
    : normalizeUrl(rawSiteUrl, "http://localhost:3000");

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  site: {
    url: computedSiteUrl,
  },
  paystack: {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
  },
  email: {
    fromEmail: process.env.SENDGRID_FROM_EMAIL || "noreply@nadinekollections.com",
    fromName: process.env.SENDGRID_FROM_NAME || "Nadine Kollections",
  },
} as const;

// ---------------------------------------------------------------------------
// Runtime assertions for required env vars (fail-fast).
// These fire once at module load; if any required value is missing the app
// aborts immediately instead of serving 500s per-request.
// ---------------------------------------------------------------------------
const REQUIRED_PUBLIC: Array<keyof typeof process.env> = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

for (const key of REQUIRED_PUBLIC) {
  if (!process.env[key]) {
    throw new Error(`[config] Missing required env var: ${key}`);
  }
}

if (process.env.NODE_ENV !== "development" && !config.supabase.serviceRoleKey) {
  throw new Error(
    "[config] SUPABASE_SERVICE_ROLE_KEY is required outside development. " +
      "Admin API routes (invite, user promotion) cannot function without it."
  );
}

if (process.env.NODE_ENV === "production") {
  // Extra guard belt: warn if we boot with an insecure scheme for the site URL.
  if (!config.site.url.startsWith("https://")) {
    console.warn(
      `⚠️ [config] Warning: NEXT_PUBLIC_SITE_URL should ideally use https:// in production. Got: "${config.site.url}".`
    );
  }
}
