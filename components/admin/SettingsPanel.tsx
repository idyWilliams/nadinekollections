"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Lock, Loader2, ShieldCheck, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
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
  const [invitations, setInvitations] = useState<any[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);

  // Settings State
  const [settings, setSettings] = useState({
    storeName: "NadineKollections",
    supportEmail: "support@nadinekollections.com",
    currency: "NGN",
    emailNotifications: true,
    lowStockNotifications: true,
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
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "admin")
        .is("deleted_at", null);
      if (data) setAdmins(data as AdminProfile[]);

      const response = await fetch("/api/admin/invitations");
      if (response.ok) {
        const inviteData = await response.json();
        setInvitations(inviteData.invitations || []);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    }
  }, [supabase]);

  const fetchSettings = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching settings:", error);
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
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings.");
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

      toast.success(data.message);
      setInviteEmail("");
      setIsInviteOpen(false);
      fetchAdmins();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to invite admin";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBanAdmin = async (adminId: string, currentlyActive: boolean) => {
    const actionLabel = currentlyActive ? "ban" : "reactivate";
    if (!confirm(`Are you sure you want to ${actionLabel} this admin?`)) return;

    setLoading(true);
    try {
      const action = currentlyActive ? "ban" : "reactivate";
      const response = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchAdmins();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update admin status";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const providers = [
    { id: 'paystack', name: 'Paystack', status: 'High Performance', statusColor: 'text-green-500' },
    { id: 'flutterwave', name: 'Flutterwave', status: 'Average Load', statusColor: 'text-yellow-500' },
    { id: 'monnify', name: 'Monnify', status: 'Stable', statusColor: 'text-green-500' },
    { id: 'remita', name: 'Remita', status: 'High Latency', statusColor: 'text-red-500' }
  ] as const;

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <div className="grid gap-6 max-w-2xl">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Store Profile</h3>
            <p className="text-sm text-muted-foreground">General store settings and configuration.</p>
          </div>
          <Card className="border-none shadow-card">
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            <Button onClick={handleSaveGeneral} disabled={loading} className="btn-primary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="team" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Team Members</h3>
            <p className="text-sm text-muted-foreground">Manage admin access and invitations.</p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <UserPlus className="mr-2 h-4 w-4" /> Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Admin</DialogTitle>
                <DialogDescription>Send an admin invitation email.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                <Button onClick={handleInviteAdmin} disabled={loading || !inviteEmail}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {admins.map((admin) => (
            <Card key={admin.id} className="border-none shadow-card overflow-hidden">
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
                    <Button variant="ghost" size="sm" onClick={() => handleBanAdmin(admin.id, admin.is_active)}>
                      {admin.is_active ? "Ban" : "Restore"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {invitations.map((invite) => (
            <Card key={invite.id} className="border-none shadow-card border-dashed bg-muted/20">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold">
                    {invite.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-3 w-3" /> Invited
                    </p>
                    <p className="text-sm">{invite.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-medium",
                    invite.status === 'accepted' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    {invite.status === 'accepted' ? "Accepted" : "Pending"}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="payments" className="space-y-6">
        <div className="grid gap-6 max-w-2xl">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Payment Configuration</h3>
            <p className="text-sm text-muted-foreground">Configure your payment gateway credentials.</p>
          </div>
          <Card className="border-none shadow-card">
            <CardHeader>
              <CardTitle>Active Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSettings({ ...settings, paymentProvider: p.id })}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all",
                      settings.paymentProvider === p.id ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <div className="font-semibold">{p.name}</div>
                    <div className={cn("text-xs", p.statusColor)}>{p.status}</div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-6 space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2"><Lock className="h-4 w-4" /> Keys</h4>
                {settings.paymentProvider === 'paystack' && (
                  <Input
                    value={settings.paystackPublicKey}
                    onChange={(e) => setSettings({ ...settings, paystackPublicKey: e.target.value })}
                    placeholder="Public Key"
                  />
                )}
                {/* ... other provider inputs ... */}
                {settings.paymentProvider === 'flutterwave' && (
                  <Input value={settings.flutterwavePublicKey} onChange={e => setSettings({ ...settings, flutterwavePublicKey: e.target.value })} placeholder="FLWPUBK_TEST..." />
                )}
                {settings.paymentProvider === 'monnify' && (
                  <div className="space-y-2">
                    <Input value={settings.monnifyPublicKey} onChange={e => setSettings({ ...settings, monnifyPublicKey: e.target.value })} placeholder="API Key" />
                    <Input value={settings.monnifyContractCode} onChange={e => setSettings({ ...settings, monnifyContractCode: e.target.value })} placeholder="Contract Code" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleSaveGeneral} disabled={loading} className="btn-primary">Save Payment Settings</Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <Card className="border-none shadow-card">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label>Email Notifications</Label>
              <Switch checked={settings.emailNotifications} onCheckedChange={v => setSettings({ ...settings, emailNotifications: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Low Stock Warnings</Label>
              <Switch checked={settings.lowStockNotifications} onCheckedChange={v => setSettings({ ...settings, lowStockNotifications: v })} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
