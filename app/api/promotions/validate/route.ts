import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { code, orderTotal } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Promo code required" }, { status: 400 });
    }

    // Fetch promotion
    const { data: promo, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("coupon_code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !promo) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
    }

    // Check if expired
    const now = new Date();
    if (promo.start_date && new Date(promo.start_date) > now) {
      return NextResponse.json({ error: "Promo code not yet active" }, { status: 400 });
    }
    if (promo.end_date && new Date(promo.end_date) < now) {
      return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });
    }

    // Check usage limit
    if (promo.total_usage_limit && promo.usage_count >= promo.total_usage_limit) {
      return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
    }

    // Check minimum order value
    if (promo.conditions?.min_order_value && orderTotal < promo.conditions.min_order_value) {
      return NextResponse.json(
        { error: `Minimum order value of ₦${promo.conditions.min_order_value} required` },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (promo.promo_type === "percentage") {
      discount = (orderTotal * promo.discount_value) / 100;
      // Cap at max discount if specified
      if (promo.conditions?.max_discount && discount > promo.conditions.max_discount) {
        discount = promo.conditions.max_discount;
      }
    } else if (promo.promo_type === "fixed") {
      discount = promo.discount_value;
    } else if (promo.promo_type === "free_shipping") {
      // Return shipping discount separately
      return NextResponse.json({
        valid: true,
        promo_id: promo.id,
        promo_type: "free_shipping",
        discount: 0,
        free_shipping: true,
        code: promo.coupon_code,
        name: promo.name,
      });
    }

    return NextResponse.json({
      valid: true,
      promo_id: promo.id,
      promo_type: promo.promo_type,
      discount: Math.min(discount, orderTotal), // Don't exceed order total
      code: promo.coupon_code,
      name: promo.name,
    });
  } catch (error: unknown) {
    console.error("Error validating promo:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
