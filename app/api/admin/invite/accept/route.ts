import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  let adminAuthClient;
  try {
    adminAuthClient = createAdminClient();
  } catch (e: any) {
    return NextResponse.json({ error: "Server configuration error", details: e?.message }, { status: 500 });
  }

  // 1. Find the pending invite by token
  const { data: invite, error: inviteErr } = await adminAuthClient
    .from("admin_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (inviteErr || !invite) {
    return NextResponse.json({ error: "Invalid or expired invitation token" }, { status: 400 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: `Invitation is no longer valid (status: ${invite.status})` }, { status: 400 });
  }

  const now = new Date();
  if (invite.expires_at && new Date(invite.expires_at) < now) {
    return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
  }

  // 2. Find the user profile by email
  const { data: profile, error: profileErr } = await adminAuthClient
    .from("profiles")
    .select("id")
    .eq("email", invite.email)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json(
      { error: "User profile not found. If you don't have an account, please sign up using the provided email." },
      { status: 404 }
    );
  }

  // 3. Update the profile
  const { error: updateProfileErr } = await adminAuthClient
    .from("profiles")
    .update({ role: "admin", is_active: true, deleted_at: null })
    .eq("id", profile.id);

  if (updateProfileErr) {
    console.error("[Accept Invite API] Error updating profile:", updateProfileErr);
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
  }

  // 4. Update the auth user metadata
  const { error: updateAuthErr } = await adminAuthClient.auth.admin.updateUserById(profile.id, {
    user_metadata: { role: "admin" }
  });

  if (updateAuthErr) {
    console.error("[Accept Invite API] Error updating auth metadata:", updateAuthErr);
    // Proceed anyway as the profile is what truly governs access
  }

  // 5. Mark invite as accepted
  const { error: updateInviteErr } = await adminAuthClient
    .from("admin_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updateInviteErr) {
    console.error("[Accept Invite API] Error marking invite as accepted:", updateInviteErr);
  }

  // 6. Redirect to login
  const siteUrl = config.site.url;
  return NextResponse.redirect(`${siteUrl}/admin/login?message=Invite Accepted! Please log in.`);
}
