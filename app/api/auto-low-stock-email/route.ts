import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import {
  generateRestockEmailHTML,
  getUrgencyLevel,
  getTrendLabel,
  type SalesData,
  type RestockEmailProduct,
} from "@/lib/emails/restock-email";

// In-memory deduplication — track which products we've auto-alerted in the last 24h
// (Resets on server restart. For persistent dedup, use a DB column like `last_low_stock_alert_at`)
const autoAlertSent: Record<string, number> = {};
const AUTO_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const CRITICAL_STOCK_THRESHOLD = 2; // Fire auto email when stock < 2

export async function POST() {
  try {
    const supabase = await createClient();

    // Auth check — only admins
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all products with stock strictly below threshold
    const { data: criticalProducts, error } = await supabase
      .from("products")
      .select("id, title, category, price, stock, primary_image, images, created_at, is_active")
      .lt("stock", CRITICAL_STOCK_THRESHOLD)
      .eq("is_active", true)
      .order("stock", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    if (!criticalProducts || criticalProducts.length === 0) {
      return NextResponse.json({ success: true, alertsSent: 0, message: "No critical stock products found" });
    }

    // Filter out products that already got an alert recently
    const now = Date.now();
    const productsToAlert = criticalProducts.filter((p) => {
      const lastSent = autoAlertSent[p.id];
      return !lastSent || now - lastSent > AUTO_COOLDOWN_MS;
    });

    if (productsToAlert.length === 0) {
      return NextResponse.json({
        success: true,
        alertsSent: 0,
        message: "All critical products already alerted within the last 24 hours",
      });
    }

    // Get admin emails
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: admins } = await serviceClient
      .from("profiles")
      .select("email, full_name")
      .eq("role", "admin")
      .eq("is_active", true);

    const adminEmails = admins?.map((a) => a.email).filter(Boolean) ?? [];
    if (adminEmails.length === 0) {
      const fallback = process.env.OWNER_EMAIL || process.env.SENDGRID_FROM_EMAIL;
      if (fallback) adminEmails.push(fallback);
    }

    if (adminEmails.length === 0) {
      return NextResponse.json({ error: "No admin emails configured" }, { status: 500 });
    }

    // Fetch 60-day sales data for all critical products at once
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

    const productIds = productsToAlert.map((p) => p.id);

    const { data: allOrderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, created_at")
      .in("product_id", productIds)
      .gte("created_at", sixtyDaysAgo);

    // Group order items by product_id
    const itemsByProduct: Record<string, Array<{ quantity: number; created_at: string }>> = {};
    for (const item of allOrderItems || []) {
      if (!itemsByProduct[item.product_id]) itemsByProduct[item.product_id] = [];
      itemsByProduct[item.product_id].push(item);
    }

    // Send emails for each critical product
    let alertsSent = 0;
    const errors: string[] = [];

    for (const product of productsToAlert) {
      try {
        const productItems = itemsByProduct[product.id] || [];
        const salesData = computeSalesData(productItems, sixtyDaysAgo, sevenDaysAgo, fourteenDaysAgo, product.stock);

        const emailProduct: RestockEmailProduct = {
          id: product.id,
          title: product.title,
          category: Array.isArray(product.category) ? product.category[0] : product.category,
          price: product.price,
          stock: product.stock,
          image: product.primary_image || product.images?.[0],
        };

        const urgency = getUrgencyLevel(product.stock);
        const trend = getTrendLabel(salesData.currentWeekUnits, salesData.previousWeekUnits);
        const subject = `🚨 [AUTO-ALERT] ${product.title} is critically low — ${product.stock} unit${product.stock !== 1 ? 's' : ''} remaining!`;

        const html = generateRestockEmailHTML(emailProduct, salesData, "auto");

        await Promise.all(
          adminEmails.map((email) => sendEmail({ to: email, subject, html }))
        );

        // Mark cooldown
        autoAlertSent[product.id] = now;
        alertsSent++;

        // Audit log in notifications
        try {
          await supabase.from("notifications").insert({
            user_id: user.id,
            type: "error",
            title: subject,
            message: `Auto restock alert: ${product.title} has only ${product.stock} unit(s). Daily avg: ${salesData.dailyAverage.toFixed(1)}/day. Est. stockout: ${salesData.estimatedDaysUntilStockout !== null ? salesData.estimatedDaysUntilStockout + ' day(s)' : 'unknown'}.`,
            link: `/admin/products/${product.id}/edit`,
            metadata: { productId: product.id, urgency, salesData, auto: true },
          });
        } catch {
          // Non-fatal
        }
      } catch (err) {
        errors.push(`${product.title}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success: true,
      alertsSent,
      productsChecked: productsToAlert.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${alertsSent} auto restock alert(s) sent to ${adminEmails.length} admin(s)`,
    });
  } catch (error) {
    console.error("Auto low stock email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Also support GET for cron job compatibility
export const GET = POST;

// ─── Shared helper ────────────────────────────────────────────────────────────

function computeSalesData(
  orderItems: Array<{ quantity: number; created_at: string }>,
  sixtyDaysAgo: string,
  sevenDaysAgo: string,
  fourteenDaysAgo: string,
  currentStock: number
): SalesData {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  let totalUnitsSold = 0;
  let currentWeekUnits = 0;
  let previousWeekUnits = 0;
  const dayTotals: Record<string, number> = {};

  for (const item of orderItems) {
    const qty = item.quantity || 1;
    const itemTime = new Date(item.created_at).getTime();
    totalUnitsSold += qty;

    if (now - itemTime <= sevenDaysMs) {
      currentWeekUnits += qty;
    } else if (now - itemTime <= fourteenDaysMs) {
      previousWeekUnits += qty;
    }

    const dayKey = new Date(item.created_at).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    dayTotals[dayKey] = (dayTotals[dayKey] || 0) + qty;
  }

  const daysTracked = Math.max(1, Math.floor((now - new Date(sixtyDaysAgo).getTime()) / (24 * 60 * 60 * 1000)));
  const dailyAverage = totalUnitsSold > 0 ? totalUnitsSold / daysTracked : 0;

  let peakDay = "";
  let peakDayUnits = 0;
  for (const [day, units] of Object.entries(dayTotals)) {
    if (units > peakDayUnits) {
      peakDay = day;
      peakDayUnits = units;
    }
  }

  const estimatedDaysUntilStockout = dailyAverage > 0 ? Math.floor(currentStock / dailyAverage) : null;

  return {
    totalUnitsSold,
    dailyAverage,
    weeklyAverage: (currentWeekUnits + previousWeekUnits) / 2,
    peakDay,
    peakDayUnits,
    previousWeekUnits,
    currentWeekUnits,
    daysTracked,
    estimatedDaysUntilStockout,
  };
}
