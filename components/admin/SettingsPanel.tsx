// ```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

interface AdminProfile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  deleted_at?: string | null;
}

type PaymentProvider = 'paystack' | 'flutterwave' | 'monnify' | 'remita';

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
    emailNotifications: true,
    lowStockNotifications: true,
    // Payment Settings
    paymentProvider: "paystack" as PaymentProvider,
    paystackPublicKey: "",
    flutterwavePublicKey: "",
    monnifyPublicKey: "",
    monnifyContractCode: "",
    remitaPublicKey: "",
    remitaMerchantId: "",
    remitaServiceTypeId: "",
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
        paymentProvider: (data.payment_provider as PaymentProvider) || prev.paymentProvider,
        paystackPublicKey: data.paystack_public_key || "",
        flutterwavePublicKey: data.flutterwave_public_key || "",
        monnifyPublicKey: data.monnify_public_key || "",
        monnifyContractCode: data.monnify_contract_code || "",
        remitaPublicKey: data.remita_public_key || "",
        remitaMerchantId: data.remita_merchant_id || "",
        remitaServiceTypeId: data.remita_service_type_id || "",
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
          currency: settings.currency,
          payment_provider: settings.paymentProvider,
          paystack_public_key: settings.paystackPublicKey,
          flutterwave_public_key: settings.flutterwavePublicKey,
          monnify_public_key: settings.monnifyPublicKey,
          monnify_contract_code: settings.monnifyContractCode,
          remita_public_key: settings.remitaPublicKey,
          remita_merchant_id: settings.remitaMerchantId,
          remita_service_type_id: settings.remitaServiceTypeId,
        });

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
      if (!confirm("Are you sure you want to reactivate this admin?")) return;
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
        if (error instanceof Error) {
          alert(error.message);
        } else {
          alert('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    } else {
      const permanentDelete = confirm("Permanently delete? Cancel to just ban.");
      const action = permanentDelete ? "delete" : "ban";
      if (!confirm(`Are you sure you want to ${action}?`)) return;
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
        if (error instanceof Error) {
          alert(error.message);
        } else {
          alert('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const providers = [
    {
      id: 'paystack',
      name: 'Paystack',
      color: 'bg-blue-500',
      icon: 'P',
      status: 'High Performance',
      uptime: '99.9%',
      statusColor: 'text-green-500',
      description: 'Seamless payments for Africa.'
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      color: 'bg-orange-500',
      icon: 'F',
      status: 'Average Load',
      uptime: '98.5%',
      statusColor: 'text-yellow-500',
      description: 'Endless possibilities for every business.'
    },
    {
      id: 'monnify',
      name: 'Monnify',
      color: 'bg-indigo-500',
      icon: 'M',
      status: 'Stable',
      uptime: '99.2%',
      statusColor: 'text-green-500',
      description: 'Powering business payments.'
    },
    {
      id: 'remita',
      name: 'Remita',
      color: 'bg-red-600',
      icon: 'R',
      status: 'High Latency',
      uptime: '95.0%',
      statusColor: 'text-red-500',
      description: 'The complete payment solution.'
    }
  ] as const;

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      {/* General Settings */}
      <TabsContent value="general" className="space-y-6">
        <div className="grid gap-6 max-w-2xl">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Store Profile</h3>
            <p className="text-sm text-muted-foreground">This information will be displayed publicly.</p>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-2">
                <Label>Store Name</Label>
                <Input
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Support Email</Label>
                <Input
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Currency</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                >
                  <option value="NGN">Nigerian Naira (₦)</option>
                  <option value="USD">US Dollar ($)</option>
                </select>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleSaveGeneral} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Team Management */}
      <TabsContent value="team" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Team Members</h3>
            <p className="text-sm text-muted-foreground">Manage who has access to the admin dashboard.</p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Administrator</DialogTitle>
                <DialogDescription>
                  Send an invitation to a new team member.
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
        </div>

        <div className="grid gap-4">
          {admins.map((admin) => (
            <Card key={admin.id} className="overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {admin.full_name?.[0] || admin.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{admin.full_name || "Admin User"}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-medium",
                    admin.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {admin.is_active ? "Active" : "Banned"}
                  </span>
                  {!["justminad@gmail.com", "widorenyin0@gmail.com"].includes(admin.email || "") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleBanAdmin(admin.id, admin.is_active)}
                    >
                      {admin.is_active ? "Ban Access" : "Restore Access"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Payment Settings */}
      <TabsContent value="payments" className="space-y-6">
        <div className="grid gap-6 max-w-2xl">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Payment Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Manage your payment gateway settings.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Provider</CardTitle>
              <CardDescription>Select the payment gateway to process transactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => setSettings({ ...settings, paymentProvider: provider.id as PaymentProvider })}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-accent",
                      settings.paymentProvider === provider.id
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-transparent"
                    )}
                  >
                    <div className="font-semibold">{provider.name}</div>
                    <div className={cn("text-xs px-2 py-0.5 rounded-full bg-muted", provider.statusColor)}>
                      {provider.status}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-6">
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  {providers.find(p => p.id === settings.paymentProvider)?.name} Credentials
                </h4>

                <div className="space-y-4">
                  {settings.paymentProvider === 'paystack' && (
                    <div className="grid gap-2">
                      <Label>Public Key</Label>
                      <Input
                        value={settings.paystackPublicKey}
                        onChange={(e) => setSettings({ ...settings, paystackPublicKey: e.target.value })}
                        placeholder="pk_test_..."
                        className="font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Available in your Paystack Dashboard Settings.
                      </p>
                    </div>
                  )}

                  {settings.paymentProvider === 'flutterwave' && (
                    <div className="grid gap-2">
                      <Label>Public Key</Label>
                      <Input
                        value={settings.flutterwavePublicKey}
                        onChange={(e) => setSettings({ ...settings, flutterwavePublicKey: e.target.value })}
                        placeholder="FLWPUBK_TEST..."
                        className="font-mono"
                      />
                    </div>
                  )}

                  {settings.paymentProvider === 'monnify' && (
                    <>
                      <div className="grid gap-2">
                        <Label>API Key</Label>
                        <Input
                          value={settings.monnifyPublicKey}
                          onChange={(e) => setSettings({ ...settings, monnifyPublicKey: e.target.value })}
                          placeholder="MK_TEST..."
                          className="font-mono"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Contract Code</Label>
                        <Input
                          value={settings.monnifyContractCode}
                          onChange={(e) => setSettings({ ...settings, monnifyContractCode: e.target.value })}
                          placeholder="1234567890"
                          className="font-mono"
                        />
                      </div>
                    </>
                  )}

                  {settings.paymentProvider === 'remita' && (
                    <>
                      <div className="grid gap-2">
                        <Label>Public Key</Label>
                        <Input
                          value={settings.remitaPublicKey}
                          onChange={(e) => setSettings({ ...settings, remitaPublicKey: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Merchant ID</Label>
                          <Input
                            value={settings.remitaMerchantId}
                            onChange={(e) => setSettings({ ...settings, remitaMerchantId: e.target.value })}
                            className="font-mono"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Service Type ID</Label>
                          <Input
                            value={settings.remitaServiceTypeId}
                            onChange={(e) => setSettings({ ...settings, remitaServiceTypeId: e.target.value })}
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveGeneral} disabled={loading}>
              {loading ? "Saving..." : "Save Payment Settings"}
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Notifications */}
      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose what you want to be notified about.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">New Order Alerts</Label>
                <p className="text-sm text-muted-foreground">
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
                <p className="text-sm text-muted-foreground">
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
