"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Globe, Search, Copy, CheckSquare, Loader2 } from "lucide-react";
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

interface Promotion {
  id: string;
  name: string;
  coupon_code: string;
  promo_type: string;
  discount_value: number;
  usage_count: number;
  total_usage_limit?: number;
  is_active: boolean;
  end_date?: string;
}

interface SEOCheck {
  task: string;
  done: boolean;
  details?: string;
}

export function MarketingPanel() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [seoChecks, setSeoChecks] = useState<SEOCheck[]>([]);
  const [seoScore, setSeoScore] = useState(0);
  const [runningAudit, setRunningAudit] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    coupon_code: "",
    promo_type: "percentage",
    discount_value: "",
    total_usage_limit: "",
    end_date: "",
  });

  useEffect(() => {
    fetchPromotions();
    loadInitialSEOChecks();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await fetch("/api/promotions");
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  const loadInitialSEOChecks = () => {
    setSeoChecks([
      { task: "Sitemap.xml generated", done: false },
      { task: "Robots.txt configured", done: false },
      { task: "Meta tags optimized", done: false },
      { task: "Alt text on images", done: false },
      { task: "Broken links check", done: false },
    ]);
  };

  const handleCreatePromo = async () => {
    if (!formData.name || !formData.coupon_code || !formData.discount_value) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          discount_value: parseFloat(formData.discount_value),
          total_usage_limit: formData.total_usage_limit ? parseInt(formData.total_usage_limit) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create promo");
      }

      toast.success("Promo code created successfully!");
      setIsCreateOpen(false);
      setFormData({
        name: "",
        coupon_code: "",
        promo_type: "percentage",
        discount_value: "",
        total_usage_limit: "",
        end_date: "",
      });
      fetchPromotions();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create promo";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code} to clipboard`);
  };

  const handleTogglePromo = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update promo");

      toast.success(`Promo ${!currentStatus ? "activated" : "deactivated"}`);
      fetchPromotions();
    } catch {
      toast.error("Failed to update promo");
    }
  };

  const runSEOAudit = async () => {
    setRunningAudit(true);
    try {
      const response = await fetch("/api/seo/audit");
      if (response.ok) {
        const data = await response.json();
        setSeoChecks(data.checks || []);
        setSeoScore(data.score || 0);
        toast.success(`SEO Audit Complete! Score: ${data.score}/100`);
      } else {
        throw new Error("Audit failed");
      }
    } catch {
      toast.error("Failed to run SEO audit");
    } finally {
      setRunningAudit(false);
    }
  };

  const getPromoStatus = (promo: Promotion) => {
    if (!promo.is_active) return "Inactive";
    if (promo.end_date && new Date(promo.end_date) < new Date()) return "Expired";
    if (promo.total_usage_limit && promo.usage_count >= promo.total_usage_limit) return "Limit Reached";
    return "Active";
  };

  const activePromos = promotions.filter((p) => p.is_active && getPromoStatus(p) === "Active");
  const totalUsage = promotions.reduce((sum, p) => sum + p.usage_count, 0);

  return (
    <div className="space-y-8">
      {/* SEO Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-text-secondary font-medium">Active Promos</p>
              <Tag className="h-4 w-4 text-primary/50" />
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold">{activePromos.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-text-secondary font-medium">Total Usage</p>
              <Globe className="h-4 w-4 text-primary/50" />
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold">{totalUsage}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-text-secondary font-medium">SEO Score</p>
              <Search className="h-4 w-4 text-primary/50" />
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold">{seoScore}/100</h3>
              <span className={`text-xs font-medium mb-1 ${seoScore >= 80 ? 'text-success' : seoScore >= 50 ? 'text-warning' : 'text-error'
                }`}>
                {seoScore >= 80 ? 'Good' : seoScore >= 50 ? 'Fair' : 'Poor'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-text-secondary font-medium">All Promos</p>
              <Tag className="h-4 w-4 text-primary/50" />
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold">{promotions.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Promotions Manager */}
        <Card className="lg:col-span-2 border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Promotions
            </CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="btn-primary">
                  <Plus className="mr-2 h-4 w-4" /> Create Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Promo Code</DialogTitle>
                  <DialogDescription>
                    Create a new promotional discount code for customers.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Promo Name *</Label>
                    <Input
                      placeholder="e.g., Summer Sale 2024"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coupon Code *</Label>
                    <Input
                      placeholder="e.g., SUMMER20"
                      value={formData.coupon_code}
                      onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.promo_type}
                        onChange={(e) => setFormData({ ...formData, promo_type: e.target.value })}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="free_shipping">Free Shipping</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Value *</Label>
                      <Input
                        type="number"
                        placeholder={formData.promo_type === "percentage" ? "20" : "5000"}
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Usage Limit (optional)</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={formData.total_usage_limit}
                        onChange={(e) => setFormData({ ...formData, total_usage_limit: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date (optional)</Label>
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePromo} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Promo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading && promotions.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : promotions.length === 0 ? (
              <div className="text-center p-8 text-text-secondary">
                No promotions yet. Create your first promo code!
              </div>
            ) : (
              <div className="space-y-4">
                {promotions.map((promo) => {
                  const status = getPromoStatus(promo);
                  return (
                    <div
                      key={promo.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border-light"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">{promo.coupon_code}</h4>
                            <Badge variant={status === "Active" ? "default" : "secondary"}>
                              {status}
                            </Badge>
                          </div>
                          <p className="text-sm text-text-secondary">
                            {promo.promo_type === "percentage" ? `${promo.discount_value}%` : `₦${promo.discount_value}`} • {promo.usage_count} uses
                            {promo.total_usage_limit ? ` / ${promo.total_usage_limit}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePromo(promo.id, promo.is_active)}
                        >
                          {promo.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleCopyCode(promo.coupon_code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO Health */}
        <Card className="border-none shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              SEO Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seoChecks.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center border flex-shrink-0 ${item.done ? "bg-success border-success text-white" : "border-border-light"
                      }`}
                  >
                    {item.done && <CheckSquare className="h-3 w-3" />}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm ${item.done ? "text-text-primary" : "text-text-secondary"}`}>
                      {item.task}
                    </span>
                    {item.details && (
                      <p className="text-xs text-text-secondary mt-1">{item.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-6"
              onClick={runSEOAudit}
              disabled={runningAudit}
            >
              {runningAudit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Audit...
                </>
              ) : (
                "Run SEO Audit"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
