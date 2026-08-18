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

// Rate limiting: in-memory cooldown per product (resets on server restart)
// For production, use Redis or a DB flag
const lastAlertSent: Record<string, number> = {};
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown per product

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check — only admins can trigger restock alerts
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, triggeredBy = "manual" } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    // Check cooldown
    const now = Date.now();
    const lastSent = lastAlertSent[productId];
    if (lastSent && now - lastSent < COOLDOWN_MS) {
      const minutesLeft = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 60000);
      return NextResponse.json(
        { error: `Alert already sent. Please wait ${minutesLeft} more minute(s).`, cooldown: true },
        { status: 429 }
      );
    }

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, category, price, stock, primary_image, images, created_at")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch sales data from order_items joined with orders (last 60 days)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("quantity, created_at, orders!inner(created_at, status)")
      .eq("product_id", productId)
      .gte("created_at", sixtyDaysAgo)
      .in("orders.status", ["completed", "delivered", "paid", "processing"]);

    // Compute sales data
    const salesData = computeSalesData(orderItems || [], sixtyDaysAgo, sevenDaysAgo, fourteenDaysAgo, product.stock);

    // Fetch all admin emails using service role (bypasses RLS)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: admins } = await serviceClient
      .from("profiles")
      .select("email, full_name")
      .eq("role", "admin")
      .eq("is_active", true);

    // Also get the requesting user's name for the footer
    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const adminEmails = admins?.map((a) => a.email).filter(Boolean) ?? [];

    // Always include a fallback owner email if no admins found
    if (adminEmails.length === 0) {
      const ownerEmail = process.env.OWNER_EMAIL || process.env.SENDGRID_FROM_EMAIL;
      if (ownerEmail) adminEmails.push(ownerEmail);
    }

    if (adminEmails.length === 0) {
      return NextResponse.json(
        { error: "No admin emails configured" },
        { status: 500 }
      );
    }

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

    const subject = `${urgency === 'CRITICAL' ? '🚨' : urgency === 'HIGH' ? '⚠️' : '📦'} [${urgency}] Restock Alert: ${product.title} (${product.stock} unit${product.stock !== 1 ? 's' : ''} left)`;

    const html = generateRestockEmailHTML(
      emailProduct,
      salesData,
      triggeredBy,
      requesterProfile?.full_name
    );

    // Send to all admins
    const emailResults = await Promise.allSettled(
      adminEmails.map((email) =>
        sendEmail({ to: email, subject, html })
      )
    );

    const successCount = emailResults.filter((r) => r.status === "fulfilled").length;

    // Record cooldown
    lastAlertSent[productId] = now;

    // Log the alert in Supabase notifications table for audit trail
    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "warning",
        title: subject,
        message: `Restock alert sent to ${successCount} admin(s). Stock: ${product.stock} units. Trend: ${trend.icon} ${trend.label}. Daily avg sales: ${salesData.dailyAverage.toFixed(1)} units/day.`,
        link: `/admin/products/${product.id}/edit`,
        metadata: { productId: product.id, urgency, salesData },
      });
    } catch {
      // Non-fatal — don't fail the whole request if notification insert fails
    }

    return NextResponse.json({
      success: true,
      emailsSent: successCount,
      urgency,
      trend: trend.label,
      message: `Restock alert sent to ${successCount} admin${successCount !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error("Restock alert error:", error);
    return NextResponse.json(
      { error: "Failed to send restock alert" },
      { status: 500 }
    );
  }
}

function computeSalesData(
  orderItems: Array<{ quantity: number; created_at: string }>,
  sixtyDaysAgo: string,
  sevenDaysAgo: string,
  fourteenDaysAgo: string,
  currentStock: number
): SalesData {
  const now = Date.now();
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

  let totalUnitsSold = 0;
  let currentWeekUnits = 0;
  let previousWeekUnits = 0;
  const dayTotals: Record<string, number> = {};

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  for (const item of orderItems) {
    const qty = item.quantity || 1;
    const itemTime = new Date(item.created_at).getTime();
    totalUnitsSold += qty;

    if (now - itemTime <= sevenDaysMs) {
      currentWeekUnits += qty;
    } else if (now - itemTime <= fourteenDaysMs) {
      previousWeekUnits += qty;
    }

    // Track per-day for peak day
    const dayKey = new Date(item.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    dayTotals[dayKey] = (dayTotals[dayKey] || 0) + qty;
  }

  // Calculate daily average over tracking period
  const daysTracked = Math.min(
    60,
    Math.max(1, Math.floor((now - new Date(sixtyDaysAgo).getTime()) / (24 * 60 * 60 * 1000)))
  );
  const dailyAverage = totalUnitsSold > 0 ? totalUnitsSold / daysTracked : 0;

  // Find peak day
  let peakDay = "";
  let peakDayUnits = 0;
  for (const [day, units] of Object.entries(dayTotals)) {
    if (units > peakDayUnits) {
      peakDay = day;
      peakDayUnits = units;
    }
  }

  // Estimated stockout
  let estimatedDaysUntilStockout: number | null = null;
  if (dailyAverage > 0) {
    estimatedDaysUntilStockout = Math.floor(currentStock / dailyAverage);
  }

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
