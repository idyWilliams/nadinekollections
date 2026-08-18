"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldX, ShieldAlert, Eye, EyeOff } from "lucide-react";

// ─── Validation ────────────────────────────────────────────────────────────────
const onboardingSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter." })
    .regex(/[0-9]/, { message: "Must contain at least one number." }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

// ─── Gate states ───────────────────────────────────────────────────────────────
type GateStatus =
  | "checking"       // running server-side verify
  | "allowed"        // invitation verified — show form
  | "no_session"     // no Supabase session at all
  | "not_invited"    // session OK but email not in admin_invitations
  | "invite_expired" // invitation exists but past expiry
  | "invite_not_pending" // already accepted / revoked
  | "server_error";  // DB / network problem

const DENIED_MESSAGES: Record<string, { icon: React.ReactNode; title: string; body: string }> = {
  no_session: {
    icon: <ShieldX className="h-14 w-14 text-red-500 mx-auto mb-4" />,
    title: "No Active Session",
    body: "Your session is missing or expired. Please click the invitation link from your email to begin account setup.",
  },
  not_invited: {
    icon: <ShieldX className="h-14 w-14 text-red-500 mx-auto mb-4" />,
    title: "Access Denied",
    body: "This setup page is only for people who have been formally invited by an existing admin. Your account has not been invited.",
  },
  invite_expired: {
    icon: <ShieldAlert className="h-14 w-14 text-amber-400 mx-auto mb-4" />,
    title: "Invitation Expired",
    body: "Your invitation link has expired (invitations are valid for 7 days). Please ask an admin to resend your invite.",
  },
  invite_not_pending: {
    icon: <ShieldAlert className="h-14 w-14 text-amber-400 mx-auto mb-4" />,
    title: "Invitation Already Used",
    body: "This invitation has already been accepted or revoked. If you already set up your account, please log in instead.",
  },
  server_error: {
    icon: <ShieldAlert className="h-14 w-14 text-amber-400 mx-auto mb-4 animate-pulse" />,
    title: "Verification Failed",
    body: "We could not verify your invitation at this time. Please try again or contact support.",
  },
};

export default function AdminOnboardingPage() {
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  // ─── Server-side invitation gate ─────────────────────────────────────────────
  const verifyInvitation = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/onboarding/verify");
      const data = await res.json();

      if (res.ok && data.allowed) {
        setUserEmail(data.email);
        setGateStatus("allowed");
      } else {
        const reason = (data.reason as GateStatus) ?? "server_error";
        setGateStatus(reason);
      }
    } catch {
      setGateStatus("server_error");
    }
  }, []);

  useEffect(() => {
    verifyInvitation();
  }, [verifyInvitation]);

  // ─── Sign out helper so denied users don't get stuck ─────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // ─── Form submit → secure server-side completion ──────────────────────────────
  const onSubmit = async (values: OnboardingValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: values.fullName, password: values.password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set up account");

      toast.success("Account set up successfully! Welcome aboard.");
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast.error(err.message || "Failed to set up account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────────
  if (gateStatus === "checking") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-white/10 animate-ping absolute" />
          <Loader2 className="h-10 w-10 text-primary animate-spin relative z-10" />
        </div>
        <p className="text-text-secondary text-sm animate-pulse">Verifying your invitation…</p>
      </div>
    );
  }

  // ─── Access denied states ──────────────────────────────────────────────────────
  if (gateStatus !== "allowed") {
    const msg = DENIED_MESSAGES[gateStatus] ?? DENIED_MESSAGES.server_error;
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-30"
          style={{
            backgroundImage: "url('/auth-bg-admin.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black z-0" />

        <div className="w-full max-w-md bg-surface/95 backdrop-blur-md p-10 rounded-xl shadow-2xl border border-white/10 relative z-10 mx-4 text-center">
          {msg.icon}
          <h1 className="text-2xl font-bold text-white mb-3">{msg.title}</h1>
          <p className="text-text-secondary text-sm leading-relaxed mb-8">{msg.body}</p>

          <div className="flex flex-col gap-3">
            {gateStatus === "server_error" && (
              <Button onClick={verifyInvitation} className="w-full py-6 font-semibold uppercase">
                Try Again
              </Button>
            )}
            {gateStatus === "invite_not_pending" && (
              <Link href="/admin/login">
                <Button className="w-full py-6 font-semibold uppercase">Go to Login</Button>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-text-secondary hover:text-white transition-colors underline underline-offset-4"
            >
              Sign out &amp; return to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Verified — render setup form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage: "url('/auth-bg-admin.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80 z-0" />

      {/* Logo */}
      <Link href="/" className="absolute top-6 left-6 z-20">
        <Image src="/logo.png" alt="NadineKollections" width={120} height={64} className="h-16 w-auto" priority />
      </Link>

      <div className="w-full max-w-md bg-surface/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/10 relative z-10 mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <ShieldCheck className="h-12 w-12 text-primary relative z-10" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Set Up Admin Account</h1>
          <p className="text-sm text-text-secondary">
            You&apos;re setting up admin access for{" "}
            <span className="text-white font-semibold">{userEmail}</span>
          </p>
        </div>

        {/* Verified badge */}
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5 mb-6">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <p className="text-green-400 text-xs font-medium">Invitation verified — this session is authorised</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jane Doe"
                      className="bg-background/50 border-white/10 focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
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
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        className="bg-background/50 border-white/10 focus:border-primary pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your password"
                        className="bg-background/50 border-white/10 focus:border-primary pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full shadow-glow py-6 text-base font-semibold tracking-wide uppercase mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Setting up…
                </span>
              ) : (
                "Complete Account Setup"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
