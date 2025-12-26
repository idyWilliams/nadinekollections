"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Upload, X, GripVertical, Tag, DollarSign, Package, Image as ImageIcon, Eye, ChevronDown } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductCard } from "@/components/customer/ProductCard";


interface ProductFormProps {
  initialData?: {
    id?: string;
    title?: string;
    description?: string;
    category?: string[];
    original_price?: number;
    sale_price?: number;
    price?: number;
    stock?: number;
    sku?: string;
    tags?: string[];
    promotion_id?: string;
    seo_meta?: { title?: string; description?: string };
    images?: string[];
    primary_image?: string;
    gallery_images?: string[];
    is_featured?: boolean;
    is_active?: boolean;
  };
  isEditing?: boolean;
}

interface FormData {
  title: string;
  description: string;
  category: string[];
  originalPrice: string;
  salePrice: string;
  stock: string;
  sku: string;
  tags: string[];
  promotionId: string;
  metaTitle: string;
  metaDescription: string;
  isFeatured: boolean;
  isActive: boolean;
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [promotions, setPromotions] = useState<Array<{
    id: string;
    code: string;
    is_active: boolean;
    coupon_code?: string;
    promo_type?: string;
    discount_value?: number;
  }>>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: ["Women"],
    originalPrice: "",
    salePrice: "",
    stock: "0",
    sku: "",
    tags: [],
    promotionId: "",
    metaTitle: "",
    metaDescription: "",
    isFeatured: false,
    isActive: true,
  });

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        category: Array.isArray(initialData.category) ? initialData.category : initialData.category ? [initialData.category] : ["Women"],
        originalPrice: initialData.original_price?.toString() || "",
        salePrice: initialData.sale_price?.toString() || initialData.price?.toString() || "",
        stock: initialData.stock?.toString() || "0",
        sku: initialData.sku || "",
        tags: initialData.tags || [],
        promotionId: initialData.promotion_id || "",
        metaTitle: initialData.seo_meta?.title || "",
        metaDescription: initialData.seo_meta?.description || "",
        isFeatured: initialData.is_featured || false,
        isActive: initialData.is_active !== false,
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
        setPromotions(data.promotions?.filter((p: { is_active: boolean }) => p.is_active) || []);
      }
    };
    fetchPromos();
  }, []);

  // Auto-generate SEO tags based on product information
  useEffect(() => {
    if (!isEditing && formData.title && formData.category) {
      const generatedTags = new Set<string>();

      // Add categories as tags
      formData.category.forEach(cat => generatedTags.add(cat.toLowerCase()));

      // Extract meaningful words from title (min 3 chars, exclude common words)
      const commonWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'new'];
      const titleWords = formData.title
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length >= 3 && !commonWords.includes(word));

      titleWords.forEach(word => generatedTags.add(word));

      // Extract from description if available
      if (formData.description) {
        const descWords = formData.description
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length >= 4 && !commonWords.includes(word))
          .slice(0, 3); // Limit to first 3 meaningful words

        descWords.forEach(word => generatedTags.add(word));
      }

      // Since category is now an array, we'll pick the first one for tag generation context or join them
      const autoTags = Array.from(generatedTags).slice(0, 8); // Limit to 8 tags
      const existingUserTags = formData.tags.filter(tag => !autoTags.includes(tag));

      setFormData(prev => ({
        ...prev,
        tags: [...new Set([...autoTags, ...existingUserTags])]
      }));
    }
  }, [formData.title, formData.description, formData.category, isEditing, formData.tags]);

  // Load draft on mount (only for new products)
  useEffect(() => {
    if (!isEditing && !initialData) {
      const saved = localStorage.getItem("productFormDraft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Separate images from formData if stored together, or handle structure
          // Assuming we stored { ...formData, images }
          const { images: savedImages, ...savedFormData } = parsed;
          if (savedFormData) setFormData(prev => ({ ...prev, ...savedFormData }));
          if (savedImages) setImages(savedImages);
          toast.info("Restored saved draft");
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [isEditing, initialData]);

  // Save draft on change (debounced slightly by nature of React updates)
  useEffect(() => {
    if (!isEditing) {
      const draft = { ...formData, images };
      localStorage.setItem("productFormDraft", JSON.stringify(draft));
    }
  }, [formData, images, isEditing]);

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const supabase = createClient();
    setIsUploading(true);
    let successCount = 0;
    const newImageUrls: string[] = [];

    // Process all files
    for (const file of files) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage
          .from("NadineKollections")
          .upload(filePath, file);

        if (error) {
          console.error(`Upload error for ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("NadineKollections")
          .getPublicUrl(filePath);

        if (urlData.publicUrl) {
          newImageUrls.push(urlData.publicUrl);
          successCount++;
        }
      } catch (error) {
        console.error(`Upload exception for ${file.name}:`, error);
      }
    }

    if (successCount > 0) {
      setImages(prev => [...prev, ...newImageUrls]);
      toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}`);
    }

    setIsUploading(false);
    // Reset input
    e.target.value = "";
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
        category: formData.category,
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
        is_featured: formData.isFeatured,
        is_active: formData.isActive,
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

      // Clear draft
      if (!isEditing) {
        localStorage.removeItem("productFormDraft");
      }

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{isEditing ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-sm text-text-secondary">
            {isEditing ? "Update product details and inventory." : "Create a new product for your store."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
                  category={formData.category[0] || "Uncategorized"}
                  stock={parseInt(formData.stock) || 0}
                  isNew={!isEditing}
                  isActive={formData.isActive}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      {formData.category.length > 0 ? formData.category.join(", ") : "Select Categories"}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px]">
                    {["Women", "Men", "Kids", "Accessories", "Gadgets"].map((cat) => (
                      <DropdownMenuCheckboxItem
                        key={cat}
                        checked={formData.category.includes(cat)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => {
                            const newCategories = checked
                              ? [...prev.category, cat]
                              : prev.category.filter(c => c !== cat);
                            return { ...prev, category: newCategories };
                          });
                        }}
                      >
                        {cat}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                    <div className="relative w-full h-full">
                      <Image
                        src={img}
                        alt={`Product ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        onError={() => {
                          // Note: Next.js Image component doesn't have simple onError like img
                          // We might need a separate state or wrapper for fallback,
                          // but for now relying on valid URLs.
                          // If fallback is critical, we'd need a custom component.
                          console.error("Error loading image", img);
                        }}
                      />
                    </div>
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
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={isUploading} />
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
            {/* Enhanced Tags Input with Pills */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                SEO Tags
                <span className="text-xs text-text-secondary font-normal">(Auto-generated, customizable)</span>
              </Label>

              {/* Tag Pills Display */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border-light">
                  {formData.tags.map((tag) => (
                    <div
                      key={tag}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-medium transition-all duration-200 border border-primary/20">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${tag} tag`}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Tag Input */}
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add custom tag and press Enter"
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Tags are auto-generated from your product title, description, and category. You can add or remove any tag.
              </p>
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
