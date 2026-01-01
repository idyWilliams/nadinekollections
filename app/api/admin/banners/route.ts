import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", details: authError }, { status: 401 });
    }

    // Only admins can access this route
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({
        error: "Forbidden",
        role: profile?.role,
        details: profileError
      }, { status: 403 });
    }

    const { data: banners, error: bannerError } = await supabase
      .from("banner_ads")
      .select("*")
      .order("display_order", { ascending: true });

    if (bannerError) throw bannerError;

    return NextResponse.json({ banners });
  } catch (error: any) {
    console.error("Error fetching admin banners:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", details: authError }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden", details: profileError }, { status: 403 });
    }

    const body = await request.json();
    const { title, subtitle, image_url, cta_text, cta_link, display_order } = body;

    const { data: banner, error: insertError } = await supabase
      .from("banner_ads")
      .insert({
        title,
        subtitle,
        image_url,
        cta_text,
        cta_link,
        display_order: display_order || 0,
        is_active: true
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ banner });
  } catch (error: any) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", details: authError }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden", details: profileError }, { status: 403 });
    }

    const { id, ...updates } = await request.json();

    const { data: banner, error: updateError } = await supabase
      .from("banner_ads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ banner });
  } catch (error: any) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", details: authError }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden", details: profileError }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from("banner_ads")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}
