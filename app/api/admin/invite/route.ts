import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("[Invite API] POST request received");
  try {
    // 1. Verify the requester is an admin
    const supabase = await createServerClient();
    console.log("[Invite API] Server client created");

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[Invite API] Auth error or no user:", authError);
      return NextResponse.json({ error: "Unauthorized", details: authError }, { status: 401 });
    }
    console.log("[Invite API] User authenticated:", user.email);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      console.error("[Invite API] Forbidden access. Role:", profile?.role, "Error:", profileError);
      return NextResponse.json({ error: "Forbidden", details: profileError }, { status: 403 });
    }
    console.log("[Invite API] User is admin, proceeding");

    // 2. Parse and normalize request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("[Invite API] Failed to parse JSON body");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    let { email } = body;
    if (!email) {
      console.error("[Invite API] Email missing in request");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    email = email.toLowerCase().trim();
    console.log("[Invite API] Inviting email:", email);

    // 3. Initialize Admin Client
    console.log("[Invite API] Initializing Admin Client with URL:", config.supabase.url);
    const adminAuthClient = createAdminClient();

    // 4. Check if user exists
    console.log("[Invite API] Checking if user exists in profiles...");
    const { data: existingUser, error: existingUserError } = await adminAuthClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error("[Invite API] Error checking existing user:", existingUserError);
    }

    if (existingUser) {
        console.log("[Invite API] Existing user found. ID:", existingUser.id);
        // User exists, update role to admin
        const { error: updateAuthError } = await adminAuthClient.auth.admin.updateUserById(
            existingUser.id,
            { user_metadata: { role: 'admin' } }
        );

        if (updateAuthError) {
          console.error("[Invite API] Error updating auth metadata:", updateAuthError);
          throw updateAuthError;
        }

        // Update profile table
        const { error: updateProfileError } = await adminAuthClient
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', existingUser.id);

        if (updateProfileError) {
          console.error("[Invite API] Error updating profiles table:", updateProfileError);
          throw updateProfileError;
        }

        // Track in invitation table
        console.log("[Invite API] Tracking promotion in admin_invitations...");
        const { error: trackError } = await adminAuthClient
            .from('admin_invitations')
            .upsert({
                email,
                invited_by: user.id,
                status: 'accepted',
                token: `PROMOTED-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                accepted_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
            }, { onConflict: 'email' });

        if (trackError) console.error("[Invite API] Error tracking promotion:", trackError);

        return NextResponse.json({ message: "Existing user promoted to Admin" });
    } else {
        console.log("[Invite API] User does not exist, sending invitation...");
        // User doesn't exist, invite them
        const siteUrl = config.site.url;
        const { error: inviteError } = await adminAuthClient.auth.admin.inviteUserByEmail(
            email,
            {
                data: { role: 'admin' },
                redirectTo: `${siteUrl}/admin/login`
            }
        );

        if (inviteError) {
          console.error("[Invite API] Error inviting user via Supabase Auth:", inviteError);
          throw inviteError;
        }

        // 5. Track in invitation table
        console.log("[Invite API] Tracking new invitation in admin_invitations...");
        const { error: trackError } = await adminAuthClient
            .from('admin_invitations')
            .upsert({
                email,
                invited_by: user.id,
                status: 'pending',
                token: `INVITE-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }, { onConflict: 'email' });

        if (trackError) {
          console.error("[Invite API] Error tracking invitation:", trackError);
          throw trackError;
        }

        // 6. Notify current admins
        console.log("[Invite API] Notifying other admins...");
        const { data: adminProfiles } = await adminAuthClient
            .from('profiles')
            .select('id')
            .eq('role', 'admin');

        if (adminProfiles) {
            const notifications = adminProfiles.map(admin => ({
                user_id: admin.id,
                title: "New Admin Invited",
                message: `An invitation has been sent to ${email}.`,
                type: 'info'
            }));

            await adminAuthClient.from('notifications').insert(notifications);
        }

        console.log("[Invite API] Success! Invitation sent.");
        return NextResponse.json({ message: "Invitation sent successfully" });
    }

  } catch (error: any) {
    console.error("[Invite API] CRITICAL ERROR:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        details: error
      },
      { status: 500 }
    );
  }
}
