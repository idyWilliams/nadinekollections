import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST: Log an admin activity
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an active admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin" || !profile.is_active) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, entityType, entityName, details, path } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("admin_activities")
      .insert({
        admin_id: user.id,
        action,
        entity_type: entityType,
        entity_name: entityName,
        details,
        path,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, activity: data });
  } catch (error: any) {
    console.error("Error logging admin activity:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

// GET: Fetch activities for a specific admin
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify calling user is an active admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin" || !profile.is_active) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetAdminId = searchParams.get("adminId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!targetAdminId) {
      return NextResponse.json({ error: "adminId query parameter is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("admin_activities")
      .select("*")
      .eq("admin_id", targetAdminId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ activities: data || [] });
  } catch (error: any) {
    console.error("Error fetching admin activities:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
