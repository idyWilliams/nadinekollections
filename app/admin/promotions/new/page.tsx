"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewPromotionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    type: "percentage_off",
    value: "",
    usageLimit: "",
    minOrderValue: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from("promotions").insert({
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        total_usage_limit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        min_order_value: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
        is_active: true,
      });

      if (error) throw error;

      router.push("/admin/promotions");
      router.refresh();
    } catch (error) {
      console.error("Error creating promotion:", error);
      alert("Failed to create promotion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create Promotion</h1>
        <p className="text-text-secondary">Add a new discount code for your customers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-surface p-6 rounded-xl border border-border-light">
        <div className="space-y-2">
          <label className="text-sm font-medium">Promo Code</label>
          <Input
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g. SUMMER20"
            className="uppercase font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="percentage_off">Percentage Off</option>
              <option value="fixed_amount">Fixed Amount Off</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Value</label>
            <Input
              type="number"
              required
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={formData.type === "percentage_off" ? "20" : "1000"}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Usage Limit (Optional)</label>
            <Input
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="e.g. 100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Min. Order Value (Optional)</label>
            <Input
              type="number"
              value={formData.minOrderValue}
              onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
              placeholder="e.g. 5000"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Promotion
          </Button>
        </div>
      </form>
    </div>
  );
}
