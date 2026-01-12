import { createStaticClient } from '@/lib/supabase/server';

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  cost_price: number | null;
  category: string[];
  primary_image: string | null;
  images: string[];
  stock: number;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variants?: {
    id: string;
    name: string; // Color name
    sku: string;
    stock: number; // or inventory_count
    image_url: string | null;
    attributes: Record<string, any>;
  }[];
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  try {
    const supabase = createStaticClient();

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        variants:product_variants(*)
      `)
      .eq("is_featured", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching featured products:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getFeaturedProducts:", error);
    return [];
  }
}

/**
 * Get related products based on category
 */
export async function getRelatedProducts(
  productId: string,
  category: string[] | string,
  limit = 4
): Promise<Product[]> {
  try {
    const supabase = createStaticClient();

    // Convert category to array if string
    const categoryArray = Array.isArray(category) ? category : [category];

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        variants:product_variants(*)
      `)
      .contains("category", categoryArray)
      .eq("is_active", true)
      .neq("id", productId)
      .limit(limit);

    if (error) {
      console.error("Error fetching related products:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getRelatedProducts:", error);
    return [];
  }
}

/**
 * Get single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createStaticClient();

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        variants:product_variants(*)
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching product by slug:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getProductBySlug:", error);
    return null;
  }
}

/**
 * Get products by category with filters
 */
export async function getProductsByCategory(
  filters: ProductFilters = {}
): Promise<{ products: Product[]; count: number }> {
  try {
    const supabase = createStaticClient();

    const {
      category,
      search,
      minPrice,
      maxPrice,
      isNew,
      isFeatured,
      page = 1,
      limit = 12,
    } = filters;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("products")
      .select("*, variants:product_variants(*)", { count: "exact" })
      .eq("is_active", true)
      .range(from, to)
      .order("created_at", { ascending: false });

    // Apply filters
    if (category && category.toLowerCase() !== "all") {
      query = query.contains("category", [category]);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    if (minPrice !== undefined) {
      query = query.gte("price", minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte("price", maxPrice);
    }

    if (isNew !== undefined) {
      query = query.eq("is_new", isNew);
    }

    if (isFeatured !== undefined) {
      query = query.eq("is_featured", isFeatured);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching products by category:", error);
      return { products: [], count: 0 };
    }

    return { products: data || [], count: count || 0 };
  } catch (error) {
    console.error("Error in getProductsByCategory:", error);
    return { products: [], count: 0 };
  }
}
