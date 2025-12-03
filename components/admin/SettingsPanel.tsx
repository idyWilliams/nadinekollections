"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Shield, CreditCard, Bell, Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCallback } from "react";

interface AdminProfile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  deleted_at?: string | null;
}

export function SettingsPanel() {
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);

  // Settings State
  const [settings, setSettings] = useState({
    storeName: "NadineKollections",
    supportEmail: "support@nadinekollections.com",
    currency: "NGN",
    paystackPublicKey: "pk_test_...",
    paystackSecretKey: "sk_test_...",
    emailNotifications: true,
    lowStockNotifications: true,
  });

  const supabase = createClient();

  const fetchAdmins = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "admin")
      .is("deleted_at", null); // Only show non-deleted admins
    if (data) setAdmins(data as AdminProfile[]);
  }, [supabase]);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
        .from("store_settings")
        .select("*")
        .single();

    if (data) {
        setSettings(prev => ({
            ...prev,
            storeName: data.store_name || prev.storeName,
            supportEmail: data.support_email || prev.supportEmail,
            currency: data.currency || prev.currency,
        }));
    }
  }, [supabase]);

  useEffect(() => {
    fetchAdmins();
    fetchSettings();
  }, [fetchAdmins, fetchSettings]);

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
        const { error } = await supabase
            .from("store_settings")
            .upsert({
                store_name: settings.storeName,
                support_email: settings.supportEmail,
                currency: settings.currency
            }); // Assuming single row logic or ID management

        if (error) throw error;
        alert("Settings saved successfully!");
    } catch (error) {
        console.error(error);
        alert("Failed to save settings.");
    } finally {
        setLoading(false);
    }
  };

  const handleInviteAdmin = async () => {
    if (!inviteEmail) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      alert(data.message);
      setInviteEmail("");
      setIsInviteOpen(false);
      fetchAdmins(); // Refresh list
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to invite admin";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBanAdmin = async (adminId: string, currentlyActive: boolean) => {
    if (!currentlyActive) {
      // Reactivate
      if (!confirm("Are you sure you want to reactivate this admin? They will be able to login again.")) return;

      setLoading(true);
      try {
        const response = await fetch("/api/admin/ban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminId, action: "reactivate" }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        alert(data.message);
        fetchAdmins();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to reactivate admin";
        alert(message);
      } finally {
        setLoading(false);
      }
    } else {
      // Ban with option to delete permanently
      const permanentDelete = confirm(
        "Do you want to PERMANENTLY DELETE this admin?\n\n" +
        "Click OK to permanently delete (cannot be undone)\n" +
        "Click Cancel to just ban (can be reactivated later)"
      );

      const action = permanentDelete ? "delete" : "ban";
      const confirmMessage = permanentDelete
        ? "Are you absolutely sure? This admin will be PERMANENTLY DELETED and cannot access the system again."
        : "Are you sure you want to ban this admin? They won't be able to login but can be reactivated later.";

      if (!confirm(confirmMessage)) return;

      setLoading(true);
      try {
        const response = await fetch("/api/admin/ban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminId, action, permanentDelete }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        alert(data.message);
        fetchAdmins();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : `Failed to ${action} admin`;
        alert(message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      {/* General Settings */}
      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" /> Store Information
            </CardTitle>
            <CardDescription>
              Manage your store&apos;s public profile and configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="NGN">Nigerian Naira (₦)</option>
                <option value="USD">US Dollar ($)</option>
              </select>
            </div>
            <Button onClick={handleSaveGeneral} disabled={loading} className="mt-4">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Team Management */}
      <TabsContent value="team">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Team Management
              </CardTitle>
              <CardDescription>
                Manage administrators and staff access.
              </CardDescription>
            </div>
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" /> Invite Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Administrator</DialogTitle>
                  <DialogDescription>
                    Enter the email address of the person you want to invite. They will receive an email to set up their account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                  <Label>Email Address</Label>
                  <Input
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                  <Button onClick={handleInviteAdmin} disabled={loading || !inviteEmail}>
                    {loading ? "Sending..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {admin.full_name?.[0] || admin.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{admin.full_name || "Admin User"}</p>
                      <p className="text-sm text-text-secondary">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                        {admin.role}
                    </span>
                    {!["justminad@gmail.com", "widorenyin0@gmail.com"].includes(admin.email || "") && (
                      <Button
                        variant={admin.is_active ? "outline" : "primary"}
                        size="sm"
                        onClick={() => handleBanAdmin(admin.id, admin.is_active)}
                        disabled={loading}
                      >
                        {admin.is_active ? "Ban" : "Reactivate"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payment Settings */}
      <TabsContent value="payments">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment Gateways
            </CardTitle>
            <CardDescription>
              Configure Paystack and other payment providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 mb-4">
                Note: Sensitive keys should be managed via Environment Variables (.env) for security.
                These fields are for display or override purposes only.
            </div>
            <div className="space-y-2">
              <Label>Paystack Public Key</Label>
              <Input type="password" value={settings.paystackPublicKey} disabled />
            </div>
            <div className="space-y-2">
              <Label>Paystack Secret Key</Label>
              <Input type="password" value={settings.paystackSecretKey} disabled />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notifications */}
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
            <CardDescription>
              Configure email alerts and system notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">New Order Alerts</Label>
                <p className="text-sm text-text-secondary">
                  Receive an email when a new order is placed.
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Low Stock Warnings</Label>
                <p className="text-sm text-text-secondary">
                  Get notified when products fall below threshold.
                </p>
              </div>
              <Switch
                checked={settings.lowStockNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, lowStockNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
