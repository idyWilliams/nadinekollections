import { createClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications";

// This would typically be run as a cron job or scheduled task
// For example, using Vercel Cron Jobs or a separate service

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const LOW_STOCK_THRESHOLD = 5;

export async function checkLowStockAndNotify() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Get all products with low stock
  const { data: lowStockProducts, error } = await supabase
    .from("products")
    .select("id, name, stock, category")
    .lt("stock", LOW_STOCK_THRESHOLD)
    .gt("stock", 0); // Only products still in stock but running low

  if (error || !lowStockProducts || lowStockProducts.length === 0) {
    return;
  }

  // 2. Get all admins who have low stock notifications enabled
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "admin")
    .eq("is_active", true);

  if (!admins || admins.length === 0) return;

  // 3. Create notifications for each admin
  const productList = lowStockProducts
    .map((p) => `${p.name} (${p.stock} left)`)
    .join(", ");

  for (const admin of admins) {
    // Check if admin has low stock notifications enabled
    // This would require adding a preferences table or field
    // For now, we'll send to all active admins

    await createNotification({
      userId: admin.id,
      type: "warning",
      title: `Low Stock Alert: ${lowStockProducts.length} Product${lowStockProducts.length > 1 ? "s" : ""}`,
      message: `The following products are running low: ${productList}`,
      link: "/admin/products",
      sendEmailTo: admin.email,
    });
  }

  console.log(`Low stock notifications sent to ${admins.length} admin(s)`);
}

// Example usage in a cron job:
// export async function GET() {
//   await checkLowStockAndNotify();
//   return Response.json({ success: true });
// }
