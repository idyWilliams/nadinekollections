import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/invite/revoke
 * Revokes a pending invitation:
 *  1. Authenticates caller + verifies role=admin.
 *  2. Parses target email.
 *  3. Verifies invitation exists and is 'pending'.
 *  4. Deletes user from auth.users (cascades to profiles).
 *  5. Sets invitation status to 'revoked'.
 *  6. Sends notifications to other active admins.
 */
export async function POST(request: Request) {
  console.log("[Revoke Invite API] POST request received");

  // ---- Stage 1: Auth & permission check --------------------------------
  let supabase;
  try {
    supabase = await createServerClient();
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("[Revoke Invite API] Stage=init_supabase failed:", e);
    return NextResponse.json(
      { error: "Initialization failed", stage: "init_supabase", details: errorMsg },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[Revoke Invite API] Stage=auth error:", authError);
    return NextResponse.json(
      { error: "Unauthorized", stage: "auth", details: authError },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active, deleted_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[Revoke Invite API] Stage=caller_profile error:", profileError);
    return NextResponse.json(
      { error: "Failed to verify caller", stage: "caller_profile", details: profileError },
      { status: 500 }
    );
  }
  if (profile?.role !== "admin" || profile?.is_active === false || profile?.deleted_at != null) {
    console.error("[Revoke Invite API] Stage=authz forbidden. profile=%o", profile);
    return NextResponse.json(
      { error: "Forbidden", stage: "authz", callerProfile: profile },
      { status: 403 }
    );
  }

  // ---- Stage 2: Parse request body -------------------------------------
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", stage: "parse_body" },
      { status: 400 }
    );
  }

  let { email } = body as { email?: string };
  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required", stage: "validate_body" },
      { status: 400 }
    );
  }
  email = email.toLowerCase().trim();
  console.log("[Revoke Invite API] Target email:", email);

  // ---- Stage 3: Retrieve invitation ------------------------------------
  let adminAuthClient;
  try {
    adminAuthClient = createAdminClient();
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("[Revoke Invite API] Stage=init_admin_client failed:", e);
    return NextResponse.json(
      { error: "Server configuration error", stage: "init_admin_client", details: errorMsg },
      { status: 500 }
    );
  }

  const { data: priorInvite, error: priorInviteErr } = await adminAuthClient
    .from("admin_invitations")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (priorInviteErr) {
    console.error("[Revoke Invite API] Stage=lookup_invite error:", priorInviteErr);
    return NextResponse.json(
      { error: "Failed to look up invitation", stage: "lookup_invite", details: priorInviteErr },
      { status: 500 }
    );
  }

  if (!priorInvite) {
    return NextResponse.json(
      { error: "Invitation not found", stage: "lookup_invite" },
      { status: 404 }
    );
  }

  if (priorInvite.status !== "pending") {
    return NextResponse.json(
      {
        error: `Only pending invitations can be revoked. Current status: ${priorInvite.status}`,
        stage: "check_status"
      },
      { status: 400 }
    );
  }

  // ---- Stage 4: Delete target user and profile -------------------------
  const { data: targetProfile, error: targetProfileErr } = await adminAuthClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (targetProfileErr) {
    console.error("[Revoke Invite API] Stage=lookup_target_profile error:", targetProfileErr);
    return NextResponse.json(
      { error: "Failed to look up target profile", stage: "lookup_target_profile", details: targetProfileErr },
      { status: 500 }
    );
  }

  if (targetProfile?.id) {
    const { error: deleteUserError } = await adminAuthClient.auth.admin.deleteUser(targetProfile.id);
    if (deleteUserError) {
      console.warn("[Revoke Invite API] Warning: Failed to delete user from auth.users:", deleteUserError);
    }
  }

  // Explicitly delete profile as fallback/cleanup
  const { error: deleteProfileErr } = await adminAuthClient
    .from("profiles")
    .delete()
    .eq("email", email);

  if (deleteProfileErr) {
    console.warn("[Revoke Invite API] Warning: Failed to delete profile row:", deleteProfileErr);
  }

  // ---- Stage 5: Revoke invitation status in DB -------------------------
  const { error: updateInviteErr } = await adminAuthClient
    .from("admin_invitations")
    .update({ status: "revoked" })
    .eq("email", email);

  if (updateInviteErr) {
    console.error("[Revoke Invite API] Stage=update_invite_status error:", updateInviteErr);
    return NextResponse.json(
      { error: "Failed to revoke invitation in database", stage: "update_invite_status", details: updateInviteErr },
      { status: 500 }
    );
  }

  // ---- Stage 6: Notify peer admins (best-effort) -----------------------
  const warnings: string[] = [];
  try {
    const { data: adminProfiles } = await adminAuthClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true)
      .is("deleted_at", null);
    if (adminProfiles && adminProfiles.length > 0) {
      const notifications = adminProfiles
        .filter(a => a.id !== user.id)
        .map(a => ({
          user_id: a.id,
          title: "Admin Invite Revoked",
          message: `The admin invitation for ${email} has been revoked by ${user.email || 'another admin'}.`,
          type: "warning" as const
        }));
      if (notifications.length > 0) {
        const { error: nErr } = await adminAuthClient.from("notifications").insert(notifications);
        if (nErr) throw nErr;
      }
    }
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("[Revoke Invite API] Warning sending notification:", e);
    warnings.push(`Failed to send notifications: ${errorMsg}`);
  }

  console.log("[Revoke Invite API] Success: invitation revoked for", email);
  return NextResponse.json({
    message: "Invitation revoked successfully",
    email,
    warnings: warnings.length ? warnings : undefined
  });
}
