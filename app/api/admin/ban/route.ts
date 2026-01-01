import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const SUPER_ADMIN_EMAILS = ["justminad@gmail.com", "widorenyin0@gmail.com"];

export async function POST(request: Request) {
  try {
    // 1. Verify the requester is a super admin
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", details: authError }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, email, full_name")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin" || !SUPER_ADMIN_EMAILS.includes(profile.email || "")) {
      return NextResponse.json({
        error: "Forbidden - Super admin access required",
        details: profileError
      }, { status: 403 });
    }

    // 2. Parse request body
    const { adminId, action, permanentDelete } = await request.json();

    if (!adminId || !action || !["ban", "reactivate", "delete"].includes(action)) {
      return NextResponse.json({
        error: "Invalid request. Provide adminId and action (ban/reactivate/delete)"
      }, { status: 400 });
    }

    // 3. Check target admin
    const { data: targetAdmin, error: targetError } = await supabase
      .from("profiles")
      .select("email, role, full_name, is_active, deleted_at")
      .eq("id", adminId)
      .single();

    if (targetError || !targetAdmin) {
      return NextResponse.json({ error: "Admin not found", details: targetError }, { status: 404 });
    }

    // Prevent actions on super admins
    if (SUPER_ADMIN_EMAILS.includes(targetAdmin.email || "")) {
      return NextResponse.json({ error: "Cannot perform actions on super admins" }, { status: 403 });
    }

    const adminAuthClient = createAdminClient();

    let message = "";
    let emailSubject = "";
    let emailBody = "";

    // 4. Perform action
    if (action === "ban") {
      // Ban the user
      const { error: updateError } = await adminAuthClient
        .from("profiles")
        .update({ is_active: false })
        .eq("id", adminId);

      if (updateError) throw updateError;

      // Sign out all sessions
      await adminAuthClient.auth.admin.signOut(adminId);

      message = permanentDelete
        ? "Admin will be permanently deleted"
        : "Admin banned successfully";

      emailSubject = "Account Suspended - NadineKollections Admin";
      emailBody = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Account Suspended</h2>
          <p>Dear ${targetAdmin.full_name || "Admin"},</p>
          <p>Your admin access to NadineKollections has been suspended.</p>
          ${permanentDelete ? '<p><strong>Note:</strong> Your account will be permanently deleted.</p>' : '<p>Please contact the super admin for more information.</p>'}
          <hr />
          <p style="font-size: 12px; color: #666;">NadineKollections Admin Team</p>
        </div>
      `;

    } else if (action === "delete") {
      // Permanently delete (soft delete)
      const { error: updateError } = await adminAuthClient
        .from("profiles")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq("id", adminId);

      if (updateError) throw updateError;

      // Sign out all sessions
      await adminAuthClient.auth.admin.signOut(adminId);

      message = "Admin permanently deleted";
      emailSubject = "Account Deleted - NadineKollections Admin";
      emailBody = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Account Deleted</h2>
          <p>Dear ${targetAdmin.full_name || "Admin"},</p>
          <p>Your admin account has been permanently removed from NadineKollections.</p>
          <p>You will no longer have access to the admin panel.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">NadineKollections Admin Team</p>
        </div>
      `;

    } else if (action === "reactivate") {
      // Reactivate the user
      const { error: updateError } = await adminAuthClient
        .from("profiles")
        .update({ is_active: true })
        .eq("id", adminId);

      if (updateError) throw updateError;

      message = "Admin reactivated successfully";
      emailSubject = "Account Reactivated - NadineKollections Admin";
      emailBody = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Account Reactivated</h2>
          <p>Dear ${targetAdmin.full_name || "Admin"},</p>
          <p>Your admin access to NadineKollections has been restored.</p>
          <p>You can now log in to the admin panel.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">NadineKollections Admin Team</p>
        </div>
      `;
    }

    // 5. Send emails
    if (targetAdmin.email) {
      try {
        await sendEmail({
          to: targetAdmin.email,
          subject: emailSubject,
          html: emailBody,
        });
      } catch (emailErr) {
        console.error("Failed to send notification email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error("Error managing admin:", error);
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
