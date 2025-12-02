
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the password reset link.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage: "url('/auth-bg.png')",
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Forgot Password</h1>
          <p className="text-text-secondary">Enter your email to reset your password</p>
        </div>

        {error && (
          <div className="bg-error/10 text-error text-sm p-3 rounded-lg mb-6 border border-error/20">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-success/10 text-success text-sm p-3 rounded-lg mb-6 border border-success/20">
            {message}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary"
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
              className="w-full shadow-glow py-6 text-lg font-semibold tracking-wide uppercase"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
