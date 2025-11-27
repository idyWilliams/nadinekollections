import { createClient } from "@supabase/supabase-js";
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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" || !SUPER_ADMIN_EMAILS.includes(profile.email || "")) {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 });
    }

    // 2. Parse request body
    const { adminId, action, permanentDelete } = await request.json();

    if (!adminId || !action || !["ban", "reactivate", "delete"].includes(action)) {
      return NextResponse.json({
        error: "Invalid request. Provide adminId and action (ban/reactivate/delete)"
      }, { status: 400 });
    }

    // 3. Check target admin
    const { data: targetAdmin } = await supabase
      .from("profiles")
      .select("email, role, full_name, is_active, deleted_at")
      .eq("id", adminId)
      .single();

    if (!targetAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Prevent actions on super admins
    if (SUPER_ADMIN_EMAILS.includes(targetAdmin.email || "")) {
      return NextResponse.json({ error: "Cannot perform actions on super admins" }, { status: 403 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminAuthClient = serviceRoleKey ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    ) : null;

    let message = "";
    let emailSubject = "";
    let emailBody = "";

    // 4. Perform action
    if (action === "ban") {
      // Ban the user
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", adminId);

      if (updateError) throw updateError;

      // Sign out all sessions
      if (adminAuthClient) {
        await adminAuthClient.auth.admin.signOut(adminId);
      }

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
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq("id", adminId);

      if (updateError) throw updateError;

      // Sign out all sessions
      if (adminAuthClient) {
        await adminAuthClient.auth.admin.signOut(adminId);
      }

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
      const { error: updateError } = await supabase
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

    // 5. Send email to target admin
    if (targetAdmin.email) {
      await sendEmail({
        to: targetAdmin.email,
        subject: emailSubject,
        html: emailBody,
      });
    }

    // 6. Send confirmation email to super admin performing the action
    if (profile.email) {
      await sendEmail({
        to: profile.email,
        subject: `Admin Action Confirmed - ${action}`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Action Confirmed</h2>
            <p>Dear ${profile.full_name || "Super Admin"},</p>
            <p>You have successfully <strong>${action}ed</strong> the admin account:</p>
            <ul>
              <li><strong>Name:</strong> ${targetAdmin.full_name || "N/A"}</li>
              <li><strong>Email:</strong> ${targetAdmin.email}</li>
              <li><strong>Action:</strong> ${action}</li>
            </ul>
            <hr />
            <p style="font-size: 12px; color: #666;">NadineKollections Admin Team</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: unknown) {
    console.error("Error managing admin:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
