import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-activity";

/**
 * POST /api/admin/onboarding/complete
 *
 * Final step of the admin onboarding flow.
 * Performs ALL privilege-sensitive operations server-side using the service-role
 * client so that RLS can never be exploited.
 *
 * Security model:
 *  1. Validates the caller has an active Supabase session.
 *  2. Uses the service-role admin client (bypasses RLS) to check that the
 *     session's email exists in admin_invitations with status = 'pending'
 *     and has not expired. This is the ONLY path to privilege elevation.
 *  3. Only then does it set the password and update the profile to role='admin'.
 *
 * A regular customer or anyone who wasn't explicitly invited via the admin
 * panel can never pass step 2, making privilege escalation impossible.
 */
export async function POST(request: Request) {
  try {
    // ── Step 1: Verify active session ─────────────────────────────────────────
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized — no valid session." }, { status: 401 });
    }

    // ── Step 2: Parse + validate body ─────────────────────────────────────────
    let fullName: string, password: string;
    try {
      ({ fullName, password } = await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Full name must be at least 2 characters." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // ── Step 3: Authoritative invitation check via service-role client ─────────
    // Use admin client so RLS cannot interfere with this read.
    const adminClient = createAdminClient();

    const { data: invite, error: inviteErr } = await adminClient
      .from("admin_invitations")
      .select("id, status, expires_at, email")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (inviteErr) {
      console.error("[Onboarding Complete] DB error checking invite:", inviteErr);
      return NextResponse.json({ error: "Server error verifying invitation." }, { status: 500 });
    }

    // No invite record at all
    if (!invite) {
      console.warn("[Onboarding Complete] No invite found for:", user.email);
      return NextResponse.json(
        { error: "Forbidden — your email has not been invited to the admin team." },
        { status: 403 }
      );
    }

    // Invite exists but is not pending
    if (invite.status !== "pending") {
      console.warn("[Onboarding Complete] Invite status is not pending:", invite.status, "for:", user.email);
      return NextResponse.json(
        { error: `Forbidden — invitation status is '${invite.status}'.` },
        { status: 403 }
      );
    }

    // Invite is expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await adminClient
        .from("admin_invitations")
        .update({ status: "expired" })
        .eq("id", invite.id);

      return NextResponse.json(
        { error: "Your invitation has expired. Please ask an admin to resend it." },
        { status: 403 }
      );
    }

    // ── Step 4: Set password via service-role client ────────────────────────────
    const { error: passwordError } = await adminClient.auth.admin.updateUserById(user.id, {
      password,
      user_metadata: { role: "admin", onboarding_completed: true },
    });

    if (passwordError) {
      console.error("[Onboarding Complete] Password update failed:", passwordError);
      throw passwordError;
    }

    // ── Step 5: Update profile (role + name) ───────────────────────────────────
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        role: "admin",
        is_active: true,
        deleted_at: null,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("[Onboarding Complete] Profile update failed:", profileError);
      throw profileError;
    }

    // ── Step 6: Mark invitation as accepted ────────────────────────────────────
    await adminClient
      .from("admin_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    // ── Step 7: Audit log ──────────────────────────────────────────────────────
    await logAdminActivity({
      adminId: user.id,
      action: "onboard",
      entityType: "user",
      entityName: fullName.trim(),
      details: "Admin completed secure onboarding — password set, role granted.",
      path: "/admin/onboarding",
    });

    console.log("[Onboarding Complete] ✅ Onboarding complete for:", user.email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Onboarding Complete] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
