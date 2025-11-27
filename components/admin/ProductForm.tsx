"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Upload, X, GripVertical, Tag, DollarSign, Package, Image as ImageIcon, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductCard } from "@/components/customer/ProductCard";

interface ProductFormProps {
  initialData?: any;
  isEditing?: boolean;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  originalPrice: string;
  salePrice: string;
  stock: string;
  sku: string;
  tags: string[];
  promotionId: string;
  metaTitle: string;
  metaDescription: string;
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "Women",
    originalPrice: "",
    salePrice: "",
    stock: "0",
    sku: "",
    tags: [],
    promotionId: "",
    metaTitle: "",
    metaDescription: "",
  });

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        category: initialData.category?.[0] || "Women",
        originalPrice: initialData.original_price?.toString() || "",
        salePrice: initialData.sale_price?.toString() || initialData.price?.toString() || "",
        stock: initialData.stock?.toString() || "0",
        sku: initialData.sku || "",
        tags: initialData.tags || [],
        promotionId: initialData.promotion_id || "",
        metaTitle: initialData.seo_meta?.title || "",
        metaDescription: initialData.seo_meta?.description || "",
      });
      setImages(initialData.images || (initialData.primary_image ? [initialData.primary_image, ...(initialData.gallery_images || [])] : []));
    }
  }, [initialData]);

  // Fetch promotions
  useEffect(() => {
    const fetchPromos = async () => {
      const res = await fetch("/api/promotions");
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.promotions?.filter((p: any) => p.is_active) || []);
      }
    };
    fetchPromos();
  }, []);

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const supabase = createClient();
    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage
        .from("NadineKollections")
        .upload(filePath, file);

      if (error) {
        console.error("Storage upload error:", error);
        toast.error(`Upload failed: ${error.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("NadineKollections")
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        toast.error("Failed to get public URL for image");
        return;
      }

      setImages([...images, urlData.publicUrl]);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    setImages(newImages);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const calculateDiscount = () => {
    const original = parseFloat(formData.originalPrice);
    const sale = parseFloat(formData.salePrice);
    if (original && sale && original > sale) {
      return Math.round(((original - sale) / original) * 100);
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Product title is required");
      return;
    }

    const salePrice = parseFloat(formData.salePrice);
    const originalPrice = parseFloat(formData.originalPrice);

    if (!salePrice || salePrice <= 0) {
      toast.error("Please enter a valid sale price");
      return;
    }

    if (originalPrice && originalPrice < salePrice) {
      toast.error("Original price cannot be less than sale price");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const productData = {
        title: formData.title,
        slug: isEditing ? undefined : slug, // Don't update slug on edit to preserve SEO
        description: formData.description || null,
        category: [formData.category],
        tags: formData.tags,
        original_price: originalPrice || salePrice,
        sale_price: salePrice,
        price: salePrice,
        stock: parseInt(formData.stock) || 0,
        sku: formData.sku || null,
        images: images,
        // Removed legacy fields to avoid schema cache errors
        promotion_id: formData.promotionId || null,
        seo_meta: {
          title: formData.metaTitle || formData.title,
          description: formData.metaDescription || formData.description,
        },
        is_active: true,
      };

      let error;
      if (isEditing && initialData?.id) {
        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert(productData);
        error = insertError;
      }

      if (error) throw error;

      toast.success(isEditing ? "Product updated successfully!" : "Product created successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (error: unknown) {
      console.error("Error saving product:", error);
      const message = error instanceof Error ? error.message : "Failed to save product";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const discount = calculateDiscount();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isEditing ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-text-secondary">
            {isEditing ? "Update product details and inventory." : "Create a new product for your store."}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" /> Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Customer View Preview</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <ProductCard
                  id="preview"
                  title={formData.title || "Product Title"}
                  slug="#"
                  price={parseFloat(formData.originalPrice) || parseFloat(formData.salePrice) || 0}
                  salePrice={parseFloat(formData.salePrice) || 0}
                  image={images[0] || "/placeholder.jpg"}
                  category={formData.category}
                  stock={parseInt(formData.stock) || 0}
                  isNew={!isEditing}
                />
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isUploading}>
            {isLoading ? "Saving..." : isUploading ? "Uploading..." : isEditing ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Summer Floral Maxi Dress"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed product description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                  <option value="Kids">Kids</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Gadgets">Gadgets</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., WMN-DRS-001"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price (₦)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-text-secondary">Leave empty if no discount</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price (₦) *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  required
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-text-secondary">Current selling price</p>
              </div>

              <div className="space-y-2">
                <Label>Discount</Label>
                <div className="h-10 flex items-center">
                  {discount > 0 ? (
                    <Badge variant="default" className="text-lg">
                      {discount}% OFF
                    </Badge>
                  ) : (
                    <span className="text-sm text-text-secondary">No discount</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion">Apply Promotion (Optional)</Label>
                <select
                  id="promotion"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.promotionId}
                  onChange={(e) => setFormData({ ...formData, promotionId: e.target.value })}
                >
                  <option value="">No promotion</option>
                  {promotions.map((promo) => (
                    <option key={promo.id} value={promo.id}>
                      {promo.coupon_code} - {promo.promo_type === "percentage" ? `${promo.discount_value}%` : `₦${promo.discount_value}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Product Images *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group aspect-square">
                  <div className="relative h-full w-full rounded-lg overflow-hidden border-2 border-border-light bg-gray-50">
                    <img
                      src={img}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-2 rounded-full bg-error text-white hover:bg-error/80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, idx - 1)}
                          className="p-2 rounded-full bg-white text-black hover:bg-gray-200"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {idx === 0 && (
                      <Badge className="absolute top-2 left-2 bg-primary">Primary</Badge>
                    )}
                  </div>
                </div>
              ))}

              <label className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-light hover:border-primary hover:bg-primary/5 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {isUploading ? (
                  <div className="flex flex-col items-center animate-pulse">
                    <Upload className="h-8 w-8 text-primary animate-bounce" />
                    <span className="mt-2 text-sm text-primary font-medium">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-text-muted" />
                    <span className="mt-2 text-sm text-text-muted">Upload Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </>
                )}
              </label>
            </div>
            <p className="text-sm text-text-secondary">
              First image will be the primary image. Click and drag to reorder.
            </p>
          </CardContent>
        </Card>

        {/* Tags & SEO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags & SEO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag and press Enter"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaTitle">SEO Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="Leave empty to use product title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">SEO Description</Label>
              <textarea
                id="metaDescription"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Leave empty to use product description"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
