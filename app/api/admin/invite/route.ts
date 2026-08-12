import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { NextResponse } from "next/server";

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
  const redirectTo = `${siteUrl}/admin/login`;

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

    // (A) Determine if the existing user is an admin or a customer
    const isAlreadyAdmin = existingUser.role === "admin"
      && existingUser.is_active !== false
      && existingUser.deleted_at == null;

    // (B) Fetch any prior admin_invitations row to know the lifecycle state
    const { data: priorInvite, error: priorInviteErr } = await adminAuthClient
      .from("admin_invitations")
      .select("id, status, resent_count, last_sent_at")
      .eq("email", email)
      .maybeSingle();
    if (priorInviteErr) {
      console.warn("[Invite API] Branch-A: prior invitation lookup failed (ignoring):", priorInviteErr);
    }

    // =================================================================
    // Sub-scenario A1: Customer (or non-admin role) => PROMOTE silently
    // =================================================================
    if (!isAlreadyAdmin) {
      console.log(`[Invite API] Sub=A1 Promote: was role=${existingUser.role}, upgrading to admin`);

      // Auth-side user_metadata update
      const { error: updateAuthError } = await adminAuthClient.auth.admin.updateUserById(
        existingUser.id,
        { user_metadata: { role: "admin" } }
      );
      if (updateAuthError) {
        console.error("[Invite API] Stage=promote_auth_metadata: error:", updateAuthError);
        return NextResponse.json(
          { error: "Failed to promote user (auth metadata)", stage: "promote_auth_metadata", details: updateAuthError },
          { status: 500 }
        );
      }

      // Profiles row update
      const { error: updateProfileError } = await adminAuthClient
        .from("profiles")
        .update({ role: "admin", is_active: true, deleted_at: null })
        .eq("id", existingUser.id);
      if (updateProfileError) {
        console.error("[Invite API] Stage=promote_profile: error:", updateProfileError);
        return NextResponse.json(
          { error: "Failed to promote user (profiles table)", stage: "promote_profile", details: updateProfileError },
          { status: 500 }
        );
      }

      // Best-effort: track promotion in admin_invitations
      try {
        const { error: trackError } = await adminAuthClient
          .from("admin_invitations")
          .upsert(
            {
              email,
              invited_by: user.id,
              status: "accepted",
              token: `PROMOTED-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
              accepted_at: new Date().toISOString(),
              last_sent_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
            },
            { onConflict: "email" }
          );
        if (trackError) throw trackError;
      } catch (e: any) {
        console.error("[Invite API] Warning tracking promotion:", e);
        warnings.push(`Failed to track promotion: ${e?.message ?? String(e)}`);
      }

      // Best-effort: notify admins of the promotion
      try {
        const { data: adminProfiles } = await adminAuthClient
          .from("profiles")
          .select("id")
          .eq("role", "admin")
          .eq("is_active", true)
          .is("deleted_at", null);
        if (adminProfiles && adminProfiles.length > 0) {
          const notifications = adminProfiles.map(a => ({
            user_id: a.id,
            title: "Admin Promoted",
            message: `${email} has been promoted to Admin.`,
            type: "info" as const
          }));
          const { error: nErr } = await adminAuthClient.from("notifications").insert(notifications);
          if (nErr) throw nErr;
        }
      } catch (e: any) {
        console.error("[Invite API] Warning sending promotion notifications:", e);
        warnings.push(`Failed to send promotion notifications: ${e?.message ?? String(e)}`);
      }

      return NextResponse.json({
        message: "Existing user promoted to Admin",
        action: "promoted",
        userId: existingUser.id,
        warnings: warnings.length ? warnings : undefined
      });
    }

    // =================================================================
    // Sub-scenario A3: Already admin + last invite was "accepted" => IDEMPOTENT
    //   They can sign in — nothing to do.  Admin UI will show "already has access".
    // =================================================================
    if (priorInvite && priorInvite.status === "accepted") {
      console.log(`[Invite API] Sub=A3 Idempotent: ${email} is already admin, invitation status=accepted`);
      return NextResponse.json({
        message: "User already has Admin access",
        action: "noop",
        reason: "already_accepted",
        userId: existingUser.id
      });
    }

    // =================================================================
    // Sub-scenarios A2 + A4:
    //   A2 = already admin + priorInvite status in (pending / revoked / expired / null)
    //   A4 = already admin but NO prior invitation in the table (they were manually created)
    //   => Call inviteUserByEmail AGAIN.
    //      Supabase regenerates the confirmation-token nonce for this auth.users row,
    //      which AUTOMATICALLY INVALIDATES THE PREVIOUS EMAILED LINK (because only the
    //      current nonce on auth.users.email_confirm_token is accepted by Supabase Auth).
    //      Then upsert admin_invitations with incremented resent_count + fresh token/expiry.
    // =================================================================
    console.log(
      `[Invite API] Sub=A2_or_A4 Resend invite: status=${priorInvite?.status ?? "none"} ` +
      `priorResentCount=${priorInvite?.resent_count ?? 0} — calling inviteUserByEmail; old link will be invalid`
    );

    const { error: resendAuthError } = await adminAuthClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: { role: "admin" },
        redirectTo
      }
    );
    if (resendAuthError) {
      // Supabase may reject if the user was e.g. soft-deleted in auth.users.
      console.error("[Invite API] Stage=resend_invite_auth: error:", resendAuthError);
      return NextResponse.json(
        {
          error: "Failed to resend admin invitation",
          message: resendAuthError.message,
          stage: "resend_invite_auth",
          code: resendAuthError.code,
          details: resendAuthError
        },
        { status: 502 }
      );
    }
    console.log(`[Invite API] Supabase inviteUserByEmail re-sent OK for ${email} — previous link now invalid`);

    // Best-effort: bump counters + write a fresh token + expiry in admin_invitations
    try {
      const nextResentCount = (priorInvite?.resent_count ?? 0) + 1;
      const { error: trackErr } = await adminAuthClient
        .from("admin_invitations")
        .upsert(
          {
            email,
            invited_by: user.id,
            status: "pending",          // Re-pend so admin UI knows we're waiting for acceptance
            resent_count: nextResentCount,
            last_sent_at: new Date().toISOString(),
            token: `INVITE-RESEND-${nextResentCount}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            accepted_at: null           // Reset — old acceptance isn't for this link
          },
          { onConflict: "email" }
        );
      if (trackErr) throw trackErr;
    } catch (e: any) {
      console.error("[Invite API] Warning tracking resent invite:", e);
      warnings.push(`Failed to track re-sent invite: ${e?.message ?? String(e)}`);
    }

    // Best-effort: notify peer admins of the re-send
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
            title: "Admin Invite Re-sent",
            message: `Admin invite re-sent to ${email} — previous invite link has been invalidated.`,
            type: "info" as const
          }));
        if (notifications.length > 0) {
          const { error: nErr } = await adminAuthClient.from("notifications").insert(notifications);
          if (nErr) throw nErr;
        }
      }
    } catch (e: any) {
      console.error("[Invite API] Warning sending resend notifications:", e);
      warnings.push(`Failed to send resend notifications: ${e?.message ?? String(e)}`);
    }

    return NextResponse.json({
      message: "Invitation re-sent; previous link has been invalidated",
      action: "resent",
      userId: existingUser.id,
      email,
      resentCount: (priorInvite?.resent_count ?? 0) + 1,
      previousInviteStatus: priorInvite?.status ?? "none",
      invalidatedPrevious: true,
      warnings: warnings.length ? warnings : undefined
    });
  }

  // =====================================================================
  // BRANCH B: No profile yet => INITIAL INVITE (brand new user)
  // =====================================================================
  console.log("[Invite API] No existing profile; sending initial invite. redirectTo=", redirectTo);

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
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
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

  console.log("[Invite API] Success: invitation dispatched to", email);
  return NextResponse.json({
    message: "Invitation sent successfully",
    action: "invited",
    email,
    warnings: warnings.length ? warnings : undefined
  });
}
