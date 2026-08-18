import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/onboarding/verify
 *
 * Server-side gate called by /admin/onboarding on mount.
 * Returns 200 with { allowed: true, email } if:
 *   - The caller has an active Supabase session, AND
 *   - Their email exists in admin_invitations with status = 'pending', AND
 *   - The invitation has not expired.
 *
 * Returns 403 in all other cases.
 * Uses the service-role admin client so RLS never interferes.
 */
export async function GET() {
  try {
    // 1. Verify the caller has an active Supabase session
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { allowed: false, reason: "no_session" },
        { status: 401 }
      );
    }

    // 2. Use service-role client to bypass RLS for the authoritative check
    const admin = createAdminClient();

    const { data: invite, error: inviteErr } = await admin
      .from("admin_invitations")
      .select("id, status, expires_at, email")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (inviteErr) {
      console.error("[Onboarding Verify] DB error checking invitations:", inviteErr);
      return NextResponse.json(
        { allowed: false, reason: "db_error" },
        { status: 500 }
      );
    }

    // 3. No invitation record at all → access denied
    if (!invite) {
      return NextResponse.json(
        { allowed: false, reason: "not_invited" },
        { status: 403 }
      );
    }

    // 4. Invitation must be pending
    if (invite.status !== "pending") {
      return NextResponse.json(
        { allowed: false, reason: "invite_not_pending", status: invite.status },
        { status: 403 }
      );
    }

    // 5. Invitation must not be expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      // Auto-mark as expired in DB
      await admin
        .from("admin_invitations")
        .update({ status: "expired" })
        .eq("id", invite.id);

      return NextResponse.json(
        { allowed: false, reason: "invite_expired" },
        { status: 403 }
      );
    }

    // ✅ All checks passed — this session is legitimately invited
    return NextResponse.json({ allowed: true, email: user.email });
  } catch (error: any) {
    console.error("[Onboarding Verify] Unexpected error:", error);
    return NextResponse.json(
      { allowed: false, reason: "server_error" },
      { status: 500 }
    );
  }
}
