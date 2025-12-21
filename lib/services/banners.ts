import { createClient } from "@/lib/supabase/server";

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
 * Get active banners ordered by display_order
 */
export async function getActiveBanners(): Promise<Banner[]> {
  try {
    const supabase = await createClient();

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
