"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function DebugPage() {
    const [status, setStatus] = useState<any>({ loading: true });

    useEffect(() => {
        async function check() {
            const supabase = createClient();

            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (!user) {
                setStatus({ error: "No user logged in", authError });
                return;
            }

            // Try reading profiles
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Try reading users (old table)
            const { data: publicUser, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            setStatus({
                userId: user.id,
                email: user.email,
                profileData: profile,
                profileError: profileError,
                usersTableData: publicUser,
                usersTableError: userError,
            });
        }

        check();
    }, []);

    return (
        <div className="p-8 space-y-4 font-mono text-sm whitespace-pre-wrap">
            <h1 className="text-xl font-bold">RLS Debugger</h1>
            <div className="bg-slate-100 p-4 rounded border">
                {JSON.stringify(status, null, 2)}
            </div>
        </div>
    );
}
