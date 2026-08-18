import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { logAdminActivity } from "@/lib/admin-activity";

/**
 * POST /api/admin/invite
 * Invites a new admin (or promotes an existing user to admin).
 *
 * Flow:
 *  1. Authenticate caller + verify caller has role=admin.
 *  2. Parse body.email, normalize.
 *  3. If profile exists for email -> promote via auth.admin.updateUserById
 *     + profiles.role update + track in admin_invitations (status=accepted).
 *  4. If profile does NOT exist -> auth.admin.inviteUserByEmail (triggers
 *     handle_new_user + notify_admin_acceptance in the DB) + tracking +
 *     notifications.
 *
 * Error-handling policy:
 *  - "Core" failures (auth operations) return a 4xx / 5xx with a clear
 *    `stage` field so support can pinpoint exactly where it failed.
 *  - "Best-effort" side effects (tracking write, notifications) never
 *    cause a 500; they're logged and surfaced as `warnings[]` in the
 *    success response.
 */
export async function POST(request: Request) {
  console.log("[Invite API] POST request received");

  // ---- Stage 1: Auth & permission check --------------------------------
  let supabase;
  try {
    supabase = await createServerClient();
  } catch (e: any) {
    console.error("[Invite API] Stage=init_supabase: failed:", e);
    return NextResponse.json(
      { error: "Initialization failed", stage: "init_supabase", details: e?.message },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[Invite API] Stage=auth: error:", authError);
    return NextResponse.json(
      { error: "Unauthorized", stage: "auth", details: authError },
      { status: 401 }
    );
  }
  console.log("[Invite API] Authenticated caller:", user.email);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active, deleted_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[Invite API] Stage=caller_profile: error:", profileError);
    return NextResponse.json(
      { error: "Failed to verify caller", stage: "caller_profile", details: profileError },
      { status: 500 }
    );
  }
  if (profile?.role !== "admin" || profile?.is_active === false || profile?.deleted_at != null) {
    console.error("[Invite API] Stage=authz: forbidden. profile=%o", profile);
    return NextResponse.json(
      { error: "Forbidden", stage: "authz", callerProfile: profile },
      { status: 403 }
    );
  }
  console.log("[Invite API] Caller authorized as admin:", user.id);

  // ---- Stage 2: Parse + normalize body ---------------------------------
  let body;
  try {
    body = await request.json();
  } catch (e) {
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
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return NextResponse.json(
      { error: "Email is invalid", stage: "validate_body", email },
      { status: 400 }
    );
  }
  console.log("[Invite API] Target email:", email);

  // ---- Stage 3: Admin supabase client + URL pre-flight checks -----------
  let adminAuthClient;
  try {
    adminAuthClient = createAdminClient();
  } catch (e: any) {
    console.error("[Invite API] Stage=init_admin_client: failed:", e);
    return NextResponse.json(
      { error: "Server configuration error", stage: "init_admin_client", details: e?.message },
      { status: 500 }
    );
  }

  const warnings: string[] = [];
  const siteUrl = config.site.url;
  const redirectTo = `${siteUrl}/admin/onboarding`;

  // Explicit URL log — searchable in production logs for invite-link debugging
  console.log(
    `[Invite API] NODE_ENV=${process.env.NODE_ENV} siteUrl=${siteUrl} redirectTo=${redirectTo}`
  );
  if (process.env.NODE_ENV === "production" && !redirectTo.startsWith("https://")) {
    console.error("[Invite API] Stage=env_check: redirectTo is not HTTPS in production:", redirectTo);
    return NextResponse.json(
      {
        error: "Server configuration error: site URL is misconfigured in production",
        stage: "env_check",
        redirectTo
      },
      { status: 500 }
    );
  }

  // ---- Stage 4: Find existing profile ----------------------------------
  const { data: existingUser, error: existingUserError } = await adminAuthClient
    .from("profiles")
    .select("id, email, role, is_active, deleted_at")
    .eq("email", email)
    .maybeSingle();

  if (existingUserError && existingUserError.code !== "PGRST116") {
    console.error("[Invite API] Stage=lookup_existing: error:", existingUserError);
    return NextResponse.json(
      { error: "Failed to look up existing user", stage: "lookup_existing", details: existingUserError },
      { status: 500 }
    );
  }

  // =====================================================================
  // BRANCH A: Existing profile — dispatch to one of 4 sub-scenarios
  //
  //   A1  role != "admin"                            -> PROMOTE (upgrade + send no email)
  //   A2  role == "admin" + invitation.status IN     -> RESEND INVITE (invalidates old link!)
  //           (pending / revoked / expired)
  //   A3  role == "admin" + invitation.status =      -> IDEMPOTENT / NO-OP
  //           accepted   (user already has access)
  //   A4  role == "admin" + NO prior invitation row  -> send invite (edge case: manual promotion)
  // =====================================================================
  if (existingUser) {
    console.log("[Invite API] Existing profile found:", existingUser);

    const isAlreadyAdmin = existingUser.role === "admin"
      && existingUser.is_active !== false
      && existingUser.deleted_at == null;

    const { data: priorInvite, error: priorInviteErr } = await adminAuthClient
      .from("admin_invitations")
      .select("id, status, resent_count, last_sent_at")
      .eq("email", email)
      .maybeSingle();

    if (isAlreadyAdmin && priorInvite && priorInvite.status === "accepted") {
      console.log(`[Invite API] Idempotent: ${email} is already admin`);
      return NextResponse.json({
        message: "User already has Admin access",
        action: "noop",
        reason: "already_accepted",
        userId: existingUser.id
      });
    }

    console.log(`[Invite API] Sending custom invite email to existing user ${email}`);
    const token = `INVITE-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const acceptLink = `${siteUrl}/api/admin/invite/accept?token=${token}`;
    const nextResentCount = (priorInvite?.resent_count ?? 0) + 1;

    const { error: trackErr } = await adminAuthClient
      .from("admin_invitations")
      .upsert(
        {
          email,
          invited_by: user.id,
          status: "pending",
          resent_count: nextResentCount,
          last_sent_at: new Date().toISOString(),
          token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null
        },
        { onConflict: "email" }
      );

    if (trackErr) {
      console.error("[Invite API] Failed to track custom invite:", trackErr);
      return NextResponse.json(
        { error: "Failed to create invitation record", details: trackErr },
        { status: 500 }
      );
    }

    const emailRes = await sendEmail({
      to: email,
      subject: "Invitation to Join NadineKollections Admin",
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
          <h2>You've been invited!</h2>
          <p>You have been invited to become an admin for NadineKollections.</p>
          <p style="margin-top: 20px;">
            <a href="${acceptLink}" style="display:inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
          </p>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Or click this link:<br/>
            <a href="${acceptLink}" style="color: #0066cc;">${acceptLink}</a>
          </p>
        </div>
      `
    });

    if (!emailRes.success) {
      console.warn("[Invite API] Email sending failed, link:", acceptLink);
      warnings.push("Failed to send invite email. The link was generated but not delivered.");
    }

    // Notify peer admins
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
            title: "Admin Invite Sent",
            message: `Admin invite sent to existing user ${email}.`,
            type: "info" as const
          }));
        if (notifications.length > 0) {
          await adminAuthClient.from("notifications").insert(notifications);
        }
      }
    } catch (e: any) {
      warnings.push(`Failed to send notifications: ${e?.message ?? String(e)}`);
    }

    await logAdminActivity({
      adminId: user.id,
      action: "create",
      entityType: "invitation",
      entityName: email,
      details: `Invited existing user ${email} to join admin team`,
      path: "/admin/settings",
    });

    return NextResponse.json({
      message: "Invitation sent successfully to existing user",
      action: "invited",
      userId: existingUser.id,
      email,
      resentCount: nextResentCount,
      warnings: warnings.length ? warnings : undefined
    });
  }

  // =====================================================================
  // BRANCH B: No profile yet => Check auth.users, then invite or promote
  // =====================================================================
  console.log("[Invite API] No existing profile; checking auth.users for:", email);

  // Check if user exists in auth.users (they may have signed up as a
  // customer but have no profiles row, or their profile was deleted).
  // Supabase's inviteUserByEmail throws "email_exists" if the auth user
  // already exists, so we must handle that case before calling it.
  let existingAuthUser: { id: string; email?: string } | null = null;
  try {
    // Try to find the user in auth by filtering — the most reliable way
    // is to use the admin listUsers and scan, but for large user bases
    // we can attempt a direct lookup via the admin API getUserById workaround:
    const { data: allUsers } = await adminAuthClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    existingAuthUser = allUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email
    ) ?? null;
  } catch (e) {
    console.warn("[Invite API] Could not search auth.users, proceeding with invite:", e);
  }

  if (existingAuthUser) {
    // ── BRANCH B1: Auth user exists but no profile ──────────────────────
    // Promote them to admin directly instead of inviting (which would fail).
    console.log(`[Invite API] Found auth user ${existingAuthUser.id} with no profile. Promoting to admin.`);

    // Update auth user metadata to include admin role
    const { error: updateAuthErr } = await adminAuthClient.auth.admin.updateUserById(
      existingAuthUser.id,
      { user_metadata: { role: "admin" } }
    );
    if (updateAuthErr) {
      console.error("[Invite API] Stage=promote_auth_user: error:", updateAuthErr);
      return NextResponse.json(
        { error: "Failed to promote user in auth", stage: "promote_auth_user", details: updateAuthErr },
        { status: 500 }
      );
    }

    // Create or update their profile with admin role
    const { error: upsertProfileErr } = await adminAuthClient
      .from("profiles")
      .upsert(
        {
          id: existingAuthUser.id,
          email,
          role: "admin",
          is_active: true,
          deleted_at: null,
        },
        { onConflict: "id" }
      );
    if (upsertProfileErr) {
      console.error("[Invite API] Stage=upsert_profile: error:", upsertProfileErr);
      warnings.push(`Profile upsert failed: ${upsertProfileErr.message}`);
    }

    // Track invitation + send custom invite email (same as Branch A)
    const token = `INVITE-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const acceptLink = `${siteUrl}/api/admin/invite/accept?token=${token}`;

    const { error: trackErr } = await adminAuthClient
      .from("admin_invitations")
      .upsert(
        {
          email,
          invited_by: user.id,
          status: "pending",
          resent_count: 0,
          last_sent_at: new Date().toISOString(),
          token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
        },
        { onConflict: "email" }
      );
    if (trackErr) {
      warnings.push(`Failed to track invitation: ${trackErr.message}`);
    }

    const emailRes = await sendEmail({
      to: email,
      subject: "You've been promoted to Admin — NadineKollections",
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
          <h2>Welcome to the Admin Team! 🎉</h2>
          <p>Your account has been promoted to admin for NadineKollections.</p>
          <p>You can now access the admin dashboard with your existing login.</p>
          <p style="margin-top: 20px;">
            <a href="${acceptLink}" style="display:inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept & Go to Admin Panel</a>
          </p>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Or click this link:<br/>
            <a href="${acceptLink}" style="color: #0066cc;">${acceptLink}</a>
          </p>
        </div>
      `,
    });
    if (!emailRes.success) {
      warnings.push("Failed to send promotion email.");
    }

    // Notify peer admins
    try {
      const { data: adminProfiles } = await adminAuthClient
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .eq("is_active", true)
        .is("deleted_at", null);
      if (adminProfiles && adminProfiles.length > 0) {
        const notifications = adminProfiles
          .filter((a) => a.id !== user.id)
          .map((a) => ({
            user_id: a.id,
            title: "Existing User Promoted to Admin",
            message: `${email} has been promoted to admin.`,
            type: "info" as const,
          }));
        if (notifications.length > 0) {
          await adminAuthClient.from("notifications").insert(notifications);
        }
      }
    } catch (e: any) {
      warnings.push(`Failed to send notifications: ${e?.message ?? String(e)}`);
    }

    await logAdminActivity({
      adminId: user.id,
      action: "update",
      entityType: "user",
      entityName: email,
      details: `Promoted existing user ${email} to admin`,
      path: "/admin/settings",
    });

    console.log("[Invite API] Success: promoted existing auth user to admin:", email);
    return NextResponse.json({
      message: "Existing user promoted to admin successfully",
      action: "promoted",
      userId: existingAuthUser.id,
      email,
      warnings: warnings.length ? warnings : undefined,
    });
  }

  // ── BRANCH B2: Truly new user — no auth record at all ─────────────────
  console.log("[Invite API] No auth user found; sending initial invite. redirectTo=", redirectTo);

  const { error: inviteError } = await adminAuthClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: { role: "admin" },
      redirectTo
    }
  );
  if (inviteError) {
    console.error("[Invite API] Stage=invite_user: error:", inviteError);
    return NextResponse.json(
      {
        error: "Failed to invite user",
        message: inviteError.message,
        stage: "invite_user",
        code: inviteError.code,
        details: inviteError
      },
      { status: 502 }
    );
  }
  console.log("[Invite API] Supabase inviteUserByEmail OK for:", email);

  // Best-effort: track initial invitation in admin_invitations
  try {
    const { error: trackError } = await adminAuthClient
      .from("admin_invitations")
      .upsert(
        {
          email,
          invited_by: user.id,
          status: "pending",
          resent_count: 0,
          last_sent_at: new Date().toISOString(),
          token: `INVITE-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null
        },
        { onConflict: "email" }
      );
    if (trackError) throw trackError;
  } catch (e: any) {
    console.error("[Invite API] Warning tracking invitation:", e);
    warnings.push(`Failed to track invitation: ${e?.message ?? String(e)}`);
  }

  // Best-effort: notify other admins of the new invite
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
          title: "New Admin Invited",
          message: `An invitation has been sent to ${email}.`,
          type: "info" as const
        }));
      if (notifications.length > 0) {
        const { error: nErr } = await adminAuthClient.from("notifications").insert(notifications);
        if (nErr) throw nErr;
      }
    }
  } catch (e: any) {
    console.error("[Invite API] Warning sending invite notifications:", e);
    warnings.push(`Failed to send notifications: ${e?.message ?? String(e)}`);
  }

  await logAdminActivity({
    adminId: user.id,
    action: "create",
    entityType: "invitation",
    entityName: email,
    details: `Sent admin invitation to ${email}`,
    path: "/admin/settings",
  });

  console.log("[Invite API] Success: invitation dispatched to", email);
  return NextResponse.json({
    message: "Invitation sent successfully",
    action: "invited",
    email,
    warnings: warnings.length ? warnings : undefined
  });
}
