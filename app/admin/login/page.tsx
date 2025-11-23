"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  otp: z.string().optional(),
});

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      otp: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);

    if (step === "credentials") {
      // Step 1: Verify Email/Password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "admin") {
        setError("Unauthorized access.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Step 2: Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) {
        setError(otpError.message);
        setLoading(false);
      } else {
        setStep("otp");
        setLoading(false);
      }
    } else {
      // Step 3: Verify OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: values.email,
        token: values.otp || "",
        type: "email",
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
      } else {
        router.push("/admin");
        router.refresh();
      }
    }
  };

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
        <img src="/logo.png" alt="NadineKollections" className="h-16 w-auto" />
      </Link>

      <div className="w-full max-w-md bg-surface/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/10 relative z-10 mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Admin Portal</h1>
          <p className="text-text-secondary">
            {step === "credentials" ? "Secure access only" : "Enter Security Code"}
          </p>
        </div>

        {error && (
          <div className="bg-error/10 text-error text-sm p-3 rounded-lg mb-6 border border-error/20">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === "credentials" ? (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-primary">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@nadinekollections.com"
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
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary"
                          {...field}
                        />
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
              </>
            ) : (
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-primary">One-Time Password (OTP)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary text-center text-2xl tracking-widest"
                        maxLength={8}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-text-secondary mt-2">
                      We sent a code to {form.getValues("email")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full shadow-glow py-6 text-lg font-semibold tracking-wide uppercase"
            >
              {loading
                ? "Processing..."
                : step === "credentials"
                ? "Verify Credentials"
                : "Verify & Login"}
            </Button>

            {step === "otp" && (
                <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="w-full text-sm text-text-secondary hover:text-primary mt-2"
                >
                    Cancel
                </button>
            )}
          </form>
        </Form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
