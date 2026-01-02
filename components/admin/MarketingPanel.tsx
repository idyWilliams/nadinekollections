"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Globe, Search, Copy, CheckSquare, Loader2, Image as ImageIcon, Trash2, Edit2, ExternalLink, Upload, X } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface Promotion {
  id: string;
  name: string;
  code: string;
  type: string;
  value: number;
  usage_count: number;
  usage_limit?: number;
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
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [seoChecks, setSeoChecks] = useState<SEOCheck[]>([]);
  const [seoScore, setSeoScore] = useState(0);
  const [runningAudit, setRunningAudit] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    coupon_code: "",
    promo_type: "percentage",
    discount_value: "",
    total_usage_limit: "",
    start_date: "",
    end_date: "",
  });

  const [bannerFormData, setBannerFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    cta_text: "",
    cta_link: "",
    display_order: "0",
  });

  useEffect(() => {
    fetchPromotions();
    fetchBanners();
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

  const fetchBanners = async () => {
    try {
      const response = await fetch("/api/admin/banners");
      if (response.ok) {
        const data = await response.json();
        setBanners(data.banners || []);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
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
        start_date: "",
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

  const deletePromotion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;

    try {
      const response = await fetch(`/api/promotions?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Promotion deleted");
        fetchPromotions();
      } else {
        throw new Error("Failed to delete promotion");
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error("Failed to delete promotion");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const supabase = createClient();
    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error } = await supabase.storage
        .from("NadineKollections")
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("NadineKollections")
        .getPublicUrl(filePath);

      if (urlData.publicUrl) {
        setBannerFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
        toast.success("Image uploaded successfully!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerFormData.image_url) {
      toast.error("Please upload an image first");
      return;
    }

    setLoading(true);
    try {
      const method = editingBanner ? "PATCH" : "POST";
      const payload = editingBanner
        ? { id: editingBanner.id, ...bannerFormData, display_order: parseInt(bannerFormData.display_order) }
        : { ...bannerFormData, display_order: parseInt(bannerFormData.display_order) };

      const response = await fetch("/api/admin/banners", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingBanner ? "Banner updated!" : "Banner created!");
        setIsBannerDialogOpen(false);
        setEditingBanner(null);
        setBannerFormData({
          title: "",
          subtitle: "",
          image_url: "",
          cta_text: "",
          cta_link: "",
          display_order: "0",
        });
        fetchBanners();
      } else {
        throw new Error("Failed to save banner");
      }
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error("Failed to save banner");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const response = await fetch(`/api/admin/banners?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Banner deleted");
        fetchBanners();
      } else {
        throw new Error("Failed to delete banner");
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Failed to delete banner");
    }
  };

  const handleToggleBanner = async (banner: Banner) => {
    try {
      const response = await fetch("/api/admin/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: banner.id, is_active: !banner.is_active }),
      });

      if (response.ok) {
        toast.success(`Banner ${!banner.is_active ? "activated" : "deactivated"}`);
        fetchBanners();
      }
    } catch {
      toast.error("Failed to update banner status");
    }
  };

  const openEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      image_url: banner.image_url,
      cta_text: banner.cta_text || "",
      cta_link: banner.cta_link || "",
      display_order: banner.display_order.toString(),
    });
    setIsBannerDialogOpen(true);
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
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return "Limit Reached";
    return "Active";
  };

  const activePromos = promotions.filter((p) => p.is_active && getPromoStatus(p) === "Active");
  const totalUsage = promotions.reduce((sum, p) => sum + p.usage_count, 0);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
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
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-text-secondary font-medium">Active Banners</p>
              <ImageIcon className="h-4 w-4 text-primary/50" />
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold">{banners.filter(b => b.is_active).length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Banner Manager */}
        <Card className="lg:col-span-2 border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Hero Banners
            </CardTitle>
            <Dialog
              open={isBannerDialogOpen}
              onOpenChange={(open) => {
                setIsBannerDialogOpen(open);
                if (!open) {
                  setEditingBanner(null);
                  setBannerFormData({
                    title: "",
                    subtitle: "",
                    image_url: "",
                    cta_text: "",
                    cta_link: "",
                    display_order: "0",
                  });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="btn-primary">
                  <Plus className="mr-2 h-4 w-4" /> Add Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editingBanner ? "Edit Banner" : "Add New Hero Banner"}</DialogTitle>
                  <DialogDescription>
                    Add a high-quality banner image for the home page hero section.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Banner Image *</Label>
                    {bannerFormData.image_url ? (
                      <div className="relative aspect-[21/9] rounded-lg overflow-hidden border">
                        <OptimizedImage
                          src={bannerFormData.image_url}
                          alt="Banner Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => setBannerFormData(prev => ({ ...prev, image_url: "" }))}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[21/9] border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        {isUploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-text-secondary mb-2" />
                            <span className="text-sm font-medium">Click to upload banner</span>
                            <span className="text-xs text-text-secondary mt-1">Recommended size: 2560x1080px</span>
                          </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        placeholder="e.g., Summer Collection"
                        value={bannerFormData.title}
                        onChange={(e) => setBannerFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input
                        placeholder="e.g., Up to 50% Off"
                        value={bannerFormData.subtitle}
                        onChange={(e) => setBannerFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CTA Text</Label>
                      <Input
                        placeholder="e.g., Shop Now"
                        value={bannerFormData.cta_text}
                        onChange={(e) => setBannerFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Link</Label>
                      <Input
                        placeholder="e.g., /shop/women"
                        value={bannerFormData.cta_link}
                        onChange={(e) => setBannerFormData(prev => ({ ...prev, cta_link: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-32">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={bannerFormData.display_order}
                      onChange={(e) => setBannerFormData(prev => ({ ...prev, display_order: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBannerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveBanner} disabled={loading || isUploading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {editingBanner ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {banners.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No hero banners yet.
              </div>
            ) : (
              <div className="space-y-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="group flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border-light">
                    <div className="relative h-16 w-24 rounded overflow-hidden flex-shrink-0">
                      <OptimizedImage src={banner.image_url} alt="" fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold truncate">{banner.title || "Untitled"}</h4>
                        <Badge variant={banner.is_active ? "default" : "secondary"}>{banner.is_active ? "Active" : "Hidden"}</Badge>
                      </div>
                      <p className="text-xs text-text-secondary truncate">{banner.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleToggleBanner(banner)}>
                        {banner.is_active ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditBanner(banner)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteBanner(banner.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
                  <div className="flex-1 text-sm">{item.task}</div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-6"
              onClick={runSEOAudit}
              disabled={runningAudit}
            >
              {runningAudit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Audit
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Promotions Manager */}
      <Card className="border-none shadow-card">
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
                  Create discount codes to reward customers, drive sales, and promote special offers. Codes can be percentage-based or fixed amounts.
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
                  <p className="text-xs text-muted-foreground">Internal name to identify this promotion in your dashboard</p>
                </div>
                <div className="space-y-2">
                  <Label>Coupon Code *</Label>
                  <Input
                    placeholder="e.g., SUMMER20"
                    value={formData.coupon_code}
                    onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                  />
                  <p className="text-xs text-muted-foreground">The code customers will enter at checkout (automatically converted to uppercase)</p>
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
                      <option value="fixed_amount">Fixed Amount</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Choose discount type</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Value *</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 20 or 5000"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.promo_type === 'percentage' ? 'Enter percentage (e.g., 20 for 20% off)' : 'Enter amount in ₦ (e.g., 5000)'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">When promotion becomes active (optional)</p>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">When promotion expires (optional)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Usage Limit</Label>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={formData.total_usage_limit}
                    onChange={(e) => setFormData({ ...formData, total_usage_limit: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Maximum number of times this code can be used (leave empty for unlimited)</p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePromo} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {promotions.map((promo) => (
              <div key={promo.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border-light">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold">{promo.code}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getPromoStatus(promo) === "Active"
                      ? "bg-success/10 text-success border-success/20"
                      : getPromoStatus(promo) === "Expired" || getPromoStatus(promo) === "Limit Reached"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-muted text-muted-foreground border-border"
                      }`}>
                      {getPromoStatus(promo)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>{promo.name}</span>
                    <span>•</span>
                    <span>{promo.type === 'percentage' ? `${promo.value}% off` : `₦${promo.value} off`}</span>
                    <span>•</span>
                    <span>{promo.usage_count} / {promo.usage_limit || "∞"} uses</span>
                  </div>
                  {promo.end_date && (
                    <p className="text-xs text-text-muted mt-1">
                      Expires: {new Date(promo.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleTogglePromo(promo.id, promo.is_active)} title={promo.is_active ? "Deactivate" : "Activate"}>
                    {promo.is_active ? <CheckSquare className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-text-muted" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleCopyCode(promo.code)} title="Copy Code">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deletePromotion(promo.id)} title="Delete Promotion">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
