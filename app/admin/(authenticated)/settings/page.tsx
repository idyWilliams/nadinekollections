"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-text-secondary">Manage your store configuration.</p>
      </div>

      <div className="grid gap-8">
        {/* General Settings */}
        <div className="bg-surface p-6 rounded-xl shadow-card border border-border-light">
          <h2 className="text-xl font-bold mb-4">General Information</h2>
          <div className="grid gap-4 max-w-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store Name</label>
              <Input defaultValue="NadineKollections" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Support Email</label>
              <Input defaultValue="support@nadinekollections.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <select className="w-full rounded-md border border-border-light bg-surface p-2 text-sm">
                <option>NGN (₦)</option>
                <option>USD ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-surface p-6 rounded-xl shadow-card border border-border-light">
          <h2 className="text-xl font-bold mb-4">Payment Gateway</h2>
          <div className="grid gap-4 max-w-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">Paystack Public Key</label>
              <Input type="password" defaultValue="pk_test_xxxxxxxxxxxxxxxx" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Paystack Secret Key</label>
              <Input type="password" defaultValue="sk_test_xxxxxxxxxxxxxxxx" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} className="btn-primary">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
