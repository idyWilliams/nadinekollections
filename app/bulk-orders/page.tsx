"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";


const bulkOrderSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  organization: z.string().optional(),
  deliveryDate: z.string().min(1, "Preferred delivery date is required"),
  details: z.string().min(10, "Please provide more details about your request"),
});

type BulkOrderFormValues = z.infer<typeof bulkOrderSchema>;

export default function BulkOrderPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BulkOrderFormValues>({
    resolver: zodResolver(bulkOrderSchema),
  });

  const onSubmit = async (data: BulkOrderFormValues) => {
    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Generate a request number
      const requestNumber = `BLK-${Date.now().toString().slice(-6)}`;

      const { error } = await supabase.from("bulk_orders").insert({
        request_number: requestNumber,
        customer_info: {
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          organization: data.organization,
        },
        preferred_delivery_date: data.deliveryDate,
        additional_notes: data.details,
        status: "new",
      });

      if (error) throw error;

      setIsSuccess(true);
      reset();
    } catch (error) {
      console.error("Error submitting bulk order:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Bulk Order Request</h1>
            <p className="text-text-secondary">
              Need large quantities for an event, corporate gift, or retail?
              Fill out the form below and our team will get back to you with a custom quote within 24 hours.
            </p>
          </div>

          {isSuccess ? (
            <div className="bg-success/10 border border-success text-success rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Request Received!</h2>
              <p>
                Thank you for your interest. We have received your bulk order request and will contact you shortly via email.
              </p>
              <Button
                className="mt-6"
                variant="outline"
                onClick={() => setIsSuccess(false)}
              >
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-surface p-8 rounded-2xl border border-border-light shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input placeholder="John Doe" {...register("fullName")} />
                  {errors.fullName && <p className="text-xs text-error">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization (Optional)</label>
                  <Input placeholder="Company Name" {...register("organization")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input type="email" placeholder="john@example.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input placeholder="+234..." {...register("phone")} />
                  {errors.phone && <p className="text-xs text-error">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Delivery Date</label>
                <Input type="date" {...register("deliveryDate")} />
                {errors.deliveryDate && <p className="text-xs text-error">{errors.deliveryDate.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Request Details</label>
                <textarea
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Please describe the items and quantities you need..."
                  {...register("details")}
                />
                {errors.details && <p className="text-xs text-error">{errors.details.message}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Submit Request
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
