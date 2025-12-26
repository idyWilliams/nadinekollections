import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch notifications for this user OR system-wide notifications (user_id is null)
    // We need to check if user is admin to see system-wide ones?
    // Actually, the RLS policy I wrote says:
    // "Admins can view all notifications"
    // "Users can view their own notifications"
    // So a simple select should work based on RLS.

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error, count } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ notifications: data, count });
  } catch (error: unknown) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, markAllRead } = await request.json();

    if (markAllRead) {
      // Mark all as read for this user
      // Note: System-wide notifications might be tricky if they are shared rows.
      // If user_id is null, marking it read would mark it read for EVERYONE.
      // So we should probably ONLY mark user-specific notifications as read,
      // OR we need a separate table for "read receipts" for system notifications.
      // For simplicity in this phase, let's assume we only mark user-owned notifications.
      // OR, we can only update where user_id = user.id.

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    } else if (id) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", user.id); // Ensure ownership

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete all read notifications for this user
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("user_id", user.id)
            .eq("is_read", true);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("Error deleting notifications:", error);
        return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 }
        );
    }
}
