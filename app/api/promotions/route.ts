import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all promotions with usage stats
    const { data: promotions, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ promotions });
  } catch (error: unknown) {
    console.error("Error fetching promotions:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      coupon_code,
      promo_type,
      discount_value,
      conditions,
      usage_limit_per_customer,
      total_usage_limit,
      start_date,
      end_date,
    } = body;

    // Validate required fields
    if (!name || !coupon_code || !promo_type || !discount_value) {
      return NextResponse.json(
        { error: "Missing required fields: name, coupon_code, promo_type, discount_value" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from("promotions")
      .select("id")
      .eq("code", coupon_code.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 400 }
      );
    }

    // Create promotion
    const { data: promotion, error } = await supabase
      .from("promotions")
      .insert({
        name,
        code: coupon_code.toUpperCase(),
        type: promo_type,
        value: discount_value,
        usage_limit: total_usage_limit,
        start_date: start_date || null,
        end_date: end_date || null, // Convert empty string to null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ promotion, message: "Promo code created successfully" });
  } catch (error: any) {
    console.error("[Promotions API] Error creating promotion:", error);
    console.error("[Promotions API] Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return NextResponse.json({
      error: "Internal Server Error",
      message: error.message,
      code: error.code,
      details: error.details
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Promotion ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("promotions")
      .update({ is_active })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Promotion updated successfully" });
  } catch (error: unknown) {
    console.error("Error updating promotion:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
