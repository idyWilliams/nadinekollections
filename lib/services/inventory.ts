import { createClient } from "@/lib/supabase/server";

export interface StockAvailability {
  available: boolean;
  stock: number;
  isActive: boolean;
  message?: string;
}

/**
 * Check if a product has sufficient stock for purchase
 */
export async function checkStockAvailability(
  productId: string,
  requestedQuantity: number
): Promise<StockAvailability> {
  try {
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .select("stock, is_active")
      .eq("id", productId)
      .single();

    if (error || !product) {
      return {
        available: false,
        stock: 0,
        isActive: false,
        message: "Product not found",
      };
    }

    if (!product.is_active) {
      return {
        available: false,
        stock: product.stock,
        isActive: false,
        message: "Product is not available for purchase",
      };
    }

    if (product.stock === 0) {
      return {
        available: false,
        stock: 0,
        isActive: true,
        message: "Product is out of stock",
      };
    }

    if (product.stock < requestedQuantity) {
      return {
        available: false,
        stock: product.stock,
        isActive: true,
        message: `Only ${product.stock} items available`,
      };
    }

    return {
      available: true,
      stock: product.stock,
      isActive: true,
    };
  } catch (error) {
    console.error("Error checking stock availability:", error);
    return {
      available: false,
      stock: 0,
      isActive: false,
      message: "Error checking availability",
    };
  }
}

/**
 * Get product availability status for display
 */
export async function getProductAvailability(productId: string): Promise<StockAvailability> {
  return checkStockAvailability(productId, 1);
}

/**
 * Check multiple products availability at once
 */
export async function checkBulkStockAvailability(
  items: Array<{ productId: string; quantity: number }>
): Promise<Map<string, StockAvailability>> {
  const results = new Map<string, StockAvailability>();

  await Promise.all(
    items.map(async (item) => {
      const availability = await checkStockAvailability(item.productId, item.quantity);
      results.set(item.productId, availability);
    })
  );

  return results;
}

/**
 * Manually decrease stock (for admin use)
 */
export async function decreaseStock(
  productId: string,
  quantity: number
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return { success: false, message: "Product not found" };
    }

    if (product.stock < quantity) {
      return { success: false, message: "Insufficient stock" };
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: product.stock - quantity })
      .eq("id", productId);

    if (updateError) {
      return { success: false, message: "Failed to update stock" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error decreasing stock:", error);
    return { success: false, message: "Error updating stock" };
  }
}

/**
 * Manually increase stock (for admin use or cancellations)
 */
export async function increaseStock(
  productId: string,
  quantity: number
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return { success: false, message: "Product not found" };
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: product.stock + quantity })
      .eq("id", productId);

    if (updateError) {
      return { success: false, message: "Failed to update stock" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error increasing stock:", error);
    return { success: false, message: "Error updating stock" };
  }
}

/**
 * Set product stock to specific value (for admin use)
 */
export async function setStock(
  productId: string,
  stock: number
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("products")
      .update({ stock: Math.max(0, stock) })
      .eq("id", productId);

    if (error) {
      return { success: false, message: "Failed to update stock" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error setting stock:", error);
    return { success: false, message: "Error updating stock" };
  }
}

/**
 * Manually decrease variant stock
 */
export async function decreaseVariantStock(
  variantId: string,
  quantity: number
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    const { data: variant, error: fetchError } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("id", variantId)
      .single();

    if (fetchError || !variant) {
      return { success: false, message: "Variant not found" };
    }

    if (variant.stock < quantity) {
      return { success: false, message: "Insufficient variant stock" };
    }

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ stock: variant.stock - quantity })
      .eq("id", variantId);

    if (updateError) {
      return { success: false, message: "Failed to update variant stock" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error decreasing variant stock:", error);
    return { success: false, message: "Error updating variant stock" };
  }
}
