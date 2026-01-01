import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", details: authError }, { status: 401 });
    }

    // Verify admin role
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

    // Fetch invitations (all statuses for audit)
    const { data, error } = await supabase
      .from("admin_invitations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({
      invitations: data,
      count: data.length,
      debug: {
        userId: user.id,
        role: profile.role,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("Error fetching invitations:", error);
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
