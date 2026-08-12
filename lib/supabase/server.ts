import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client factory — THREE intentionally-distinct variants:
 *
 *   1. createClient()           -> cookie-bound, authenticated-reader.
 *                                 Uses `cookies()` from next/headers which is a
 *                                 NEXT_DYNAMIC_PRIMITIVE; it forces the route to
 *                                 be SSR (NOT statically prerenderable). Use this
 *                                 ONLY for user-scoped reads/writes (cart, profile,
 *                                 checkout-success lookups by uid, admin pages).
 *
 *   2. createPublicClient()     -> ANONYMOUS reader, NO cookies touched.
 *                                 Returns a server client configured with the
 *                                 ANON key but with empty cookie storage. This
 *                                 variant is 100% static-generation safe and
 *                                 is the correct choice for all public-data reads
 *                                 (banners, products, sitemap, category listing,
 *                                 public stock checks).  This deliberately does
 *                                 NOT read the user session; RLS should be used
 *                                 on the database side to ensure anon users can
 *                                 only read public rows.
 *
 *   3. createStaticClient       -> kept as a backward-compat alias for
 *                                 `createPublicClient`.  The existing callers in
 *                                 products.ts and sitemap.ts already use this
 *                                 name, and renaming it would be an invasive
 *                                 change for no security gain.
 *
 * Never swap these casually. Choosing the wrong one either:
 *   - forces unnecessary SSR / breaks static export (createClient in public pages), OR
 *   - skips RLS for user-scoped data (createPublicClient where auth matters).
 */

/* -------------------------------------------------------------------------- */
/* 1. Cookie-bound authenticated reader                                       */
/* -------------------------------------------------------------------------- */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // Safe to ignore when middleware refreshes user sessions.
          }
        },
      },
    }
  )
}

/* -------------------------------------------------------------------------- */
/* 2. Anonymous / public-data reader                                          */
/* -------------------------------------------------------------------------- */
export function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll(_cookiesToSet) {
          // Intentional no-op: the anonymous client never writes cookies,
          // and never reads them (so it can be statically prerendered).
        },
      },
    }
  )
}

/* -------------------------------------------------------------------------- */
/* 3. Backward-compat alias                                                   */
/* -------------------------------------------------------------------------- */
export const createStaticClient = createPublicClient
