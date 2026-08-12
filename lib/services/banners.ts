import { createPublicClient } from "@/lib/supabase/server";

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

/**
 * Get active banners ordered by display_order.
 *
 * Uses `createPublicClient` (ANON key, no cookies) — this function is
 * static-generation-safe.  The homepage can prerender because no
 * request-scoped primitive (cookies, headers) is touched here.
 *
 * Permissions rely entirely on RLS:
 *   "Public can view active banner ads" ON banner_ads FOR SELECT
 *   USING (is_active = true).
 */
export async function getActiveBanners(): Promise<Banner[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("banner_ads")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching banners:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getActiveBanners:", error);
    return [];
  }
}
