"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Clock } from "lucide-react";
import { normaliseAuthError } from "@/lib/auth-errors";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startRateLimitCountdown = (seconds: number) => {
    setRateLimitSeconds(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRateLimitSeconds((s) => {
        if (s <= 1) { clearInterval(countdownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (rateLimitSeconds > 0) return;
    setLoading(true);
    setError(null);

    try {
      // Step 1: Attempt login using password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        const result = normaliseAuthError(signInError);
        setError(result.message);
        if (result.isRateLimit) startRateLimitCountdown(result.retryAfterSeconds);
        setLoading(false);
        return;
      }

      // Step 2: Query user profile to verify role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active, deleted_at")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        setError("User profile not found.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const allowedRoles = ["super_admin", "admin", "manager", "support"];
      if (!allowedRoles.includes(profile.role) || !profile.is_active || profile.deleted_at !== null) {
        setError("Access denied. You do not have permission to view the Admin Portal.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Step 3: Log login activity
      await fetch("/api/admin/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          entityType: "user",
          entityName: values.email,
          details: "Admin logged in successfully via credentials",
          path: "/admin/login",
        }),
      }).catch((e) => console.warn("Failed to log login activity:", e));

      // Redirect to the canonical Admin Dashboard
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      console.error("Login unexpected error:", err);
      setError(err?.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background — pointer-events-none so touches reach the form */}
      <div
        className="absolute inset-0 z-0 opacity-60 pointer-events-none"
        style={{
          backgroundImage: "url('/auth-bg-admin.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80 z-0 pointer-events-none" />

      {/* Top Left Logo */}
      <Link href="/" className="absolute top-6 left-6 z-20">
        <Image src="/logo.png" alt="NadineKollections" width={120} height={64} className="h-16 w-auto" priority />
      </Link>

      {/* Card — my-8 for mobile scrollability */}
      <div className="w-full max-w-md bg-surface/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/10 relative z-10 mx-4 my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Admin Portal</h1>
          <p className="text-text-secondary">Secure credentials login only</p>
        </div>

        {error && (
          <div className={`text-sm p-3 rounded-lg mb-6 border flex items-start gap-2 ${
            rateLimitSeconds > 0
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-error/10 text-error border-error/20"
          }`}>
            {rateLimitSeconds > 0 && <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            <span>
              {error}
              {rateLimitSeconds > 0 && (
                <span className="block mt-1 font-semibold">Retry in {rateLimitSeconds}s…</span>
              )}
            </span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@nadinekollections.com"
                      autoComplete="email"
                      className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary pr-11"
                        {...field}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors p-1 touch-manipulation"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading || rateLimitSeconds > 0}
              className="w-full shadow-glow py-6 text-lg font-semibold tracking-wide uppercase touch-manipulation"
            >
              {loading ? "Verifying Credentials…" : "Verify & Login"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-text-secondary hover:text-primary transition-colors touch-manipulation"
          >
            ← Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
