"use client";

import { useState, useEffect } from "react";
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
import { Loader2, ShieldCheck, Lock } from "lucide-react";

const onboardingSchema = z.object({
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Please confirm your password.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function AdminOnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email ?? null);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Error checking session:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();
  }, [supabase]);

  const onSubmit = async (values: OnboardingValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication expired. Please log in or request a new invite.");
        setLoading(false);
        return;
      }

      // 1. Set password in auth.users
      const { error: passwordError } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (passwordError) throw passwordError;

      // 2. Set full name in profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: values.fullName,
          role: "admin", // Ensure they have admin access
          is_active: true,
          deleted_at: null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 3. Log the onboarding activity
      try {
        await fetch("/api/admin/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "onboard",
            entityType: "user",
            entityName: values.fullName,
            details: `Completed admin onboarding and set password`,
            path: "/admin/onboarding",
          }),
        });
      } catch (activityErr) {
        console.warn("Failed to log activity, continuing anyway:", activityErr);
      }

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80 z-0" />
        <div className="w-full max-w-md bg-surface/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/10 relative z-10 mx-4 text-center">
          <ShieldCheck className="h-16 w-16 text-error mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Session</h1>
          <p className="text-text-secondary mb-6 text-sm">
            Your invitation session is invalid or expired. To set up your account, please click the link sent in your invitation email or request a new invite from an admin.
          </p>
          <Link href="/admin/login">
            <Button className="w-full uppercase py-6 font-semibold">
              Go to Login Page
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage: "url('/auth-bg-admin.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80 z-0" />

      {/* Top Left Logo */}
      <Link href="/" className="absolute top-6 left-6 z-20">
        <Image src="/logo.png" alt="NadineKollections" width={120} height={64} className="h-16 w-auto" priority />
      </Link>

      <div className="w-full max-w-md bg-surface/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/10 relative z-10 mx-4">
        <div className="text-center mb-6">
          <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-primary mb-1">Set Up Admin Account</h1>
          <p className="text-sm text-text-secondary">
            Set your name and password for <span className="text-white font-medium">{userEmail}</span>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-background/50 border-white/10 focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-background/50 border-white/10 focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full shadow-glow py-6 text-base font-semibold tracking-wide uppercase mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
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
