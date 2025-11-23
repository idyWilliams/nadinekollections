import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Verify the requester is an admin
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Parse request body
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 3. Initialize Service Role Client (for privileged actions)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

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

    // 4. Check if user exists
    // We'll try to invite them. If they exist, we'll update their metadata.
    const { data: existingUser } = await adminAuthClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
        // User exists, update role to admin
        const { error: updateError } = await adminAuthClient.auth.admin.updateUserById(
            existingUser.id,
            { user_metadata: { role: 'admin' } }
        );

        // Also update profile table via RLS bypass (service role)
        await adminAuthClient
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', existingUser.id);

        if (updateError) throw updateError;

        return NextResponse.json({ message: "Existing user promoted to Admin" });
    } else {
        // User doesn't exist, invite them
        const { data, error: inviteError } = await adminAuthClient.auth.admin.inviteUserByEmail(
            email,
            {
                data: { role: 'admin' },
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/login`
            }
        );

        if (inviteError) throw inviteError;

        return NextResponse.json({ message: "Invitation sent successfully" });
    }

  } catch (error: any) {
    console.error("Error inviting admin:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
