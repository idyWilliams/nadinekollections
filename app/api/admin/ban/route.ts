import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SUPER_ADMIN_EMAILS = ["justminad@gmail.com", "widorenyin0@gmail.com"];

export async function POST(request: Request) {
  try {
    // 1. Verify the requester is a super admin
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" || !SUPER_ADMIN_EMAILS.includes(profile.email || "")) {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 });
    }

    // 2. Parse request body
    const { adminId, action } = await request.json();

    if (!adminId || !action || !["ban", "unban"].includes(action)) {
      return NextResponse.json({ error: "Invalid request. Provide adminId and action (ban/unban)" }, { status: 400 });
    }

    // 3. Check target admin
    const { data: targetAdmin } = await supabase
      .from("profiles")
      .select("email, role")
      .eq("id", adminId)
      .single();

    if (!targetAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Prevent banning super admins
    if (SUPER_ADMIN_EMAILS.includes(targetAdmin.email || "")) {
      return NextResponse.json({ error: "Cannot ban super admins" }, { status: 403 });
    }

    // 4. Update admin status
    const isActive = action === "unban";
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", adminId);

    if (updateError) throw updateError;

    // 5. If banning, also sign out the user (optional - requires service role)
    if (action === "ban") {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const adminAuthClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );

        // Sign out all sessions for this user
        await adminAuthClient.auth.admin.signOut(adminId);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Admin ${action === "ban" ? "banned" : "unbanned"} successfully`,
    });
  } catch (error: unknown) {
    console.error("Error managing admin:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
