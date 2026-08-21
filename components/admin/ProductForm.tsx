"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Upload, X, GripVertical, Tag, DollarSign, Package, Image as ImageIcon, Eye, Info, Plus, Trash2, Wand2, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductCard } from "@/components/customer/ProductCard";


interface ProductFormProps {
  initialData?: {
    id?: string;
    title?: string;
    description?: string;
    category?: string[];
    brand_id?: string;
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
    variants?: Array<Partial<ProductVariant> & {
      attributes?: { color?: string; size?: string; hex?: string };
    }>;
  };
  isEditing?: boolean;
}

interface FormData {
  title: string;
  description: string;
  category: string[];
  brandId: string;
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

interface ProductVariant {
  id?: string;
  name: string; // Composite name "Color - Size"
  color: string; // Explicit color name
  size?: string; // Explicit size
  sku: string;
  stock: number;
  image_url?: string;
  hex?: string;
}

// ------------------------- CATEGORY TAXONOMY ------------------------------
// Top-level buckets (first tag) + sub categories (extra tags)
// A product can be tagged with MULTIPLE — e.g. ["Women", "Shoes", "Pumps", "Corporate"]
const TOP_LEVEL_CATEGORIES = [
  "Women", "Men", "Kids", "Teens",
  "Accessories", "Gadgets", "Beauty",
];
const SUB_CATEGORIES = [
  // Apparel types
  "Clothing", "Corporate Wear", "Leisure Wear", "Casual Wear", "Formal Wear",
  // Footwear — major category (user says shoes are huge)
  "Shoes", "Pumps", "Heels", "Flats", "Loafers", "Palms",
  "Sneakers", "Sandals", "Boots", "Slippers",
  // Women's big-ticket lines
  "Wigs", "Bags", "Handbags", "Purses",
  "Watches", "Bangles", "Jewelry", "Earrings",
  "Hosiery", "Pantyhose", "Scarves",
  // Kids/teens/men sub
  "Girls", "Boys", "School Wear",
  "Caps", "Jeans", "Shirts", "Suits",
  // Aviation + corporate niche (niche premium)
  "Aviation", "Aviation Pins",
  // Beauty
  "Makeup", "Makeup Brushes", "Makeup Boxes", "Ring Lights",
  // Gadgets sub
  "Phone Holders", "Cameras", "Dashcams",
];
const ALL_CATEGORIES = Array.from(new Set([...TOP_LEVEL_CATEGORIES, ...SUB_CATEGORIES]));

// Helper: category -> suggested "applies to" (audience) tags – purely for ProductFilters sidebar.
const CATEGORY_GROUPS: Record<string, string[]> = {
  "Audience":     ["Women", "Men", "Kids", "Teens", "Girls", "Boys"],
  "Product Type": ["Clothing", "Shoes", "Wigs", "Bags", "Handbags", "Purses",
                 "Watches", "Jewelry", "Earrings", "Bangles", "Hosiery", "Pantyhose",
                 "Scarves", "Caps", "Jeans", "Shirts", "Suits",
                 "Makeup", "Makeup Brushes", "Makeup Boxes", "Ring Lights",
                 "Phone Holders", "Cameras", "Dashcams"],
  "Shoe Styles":  ["Pumps", "Heels", "Flats", "Loafers", "Palms", "Sneakers",
                 "Sandals", "Boots", "Slippers"],
  "Style/Occasion": ["Corporate Wear", "Leisure Wear", "Casual Wear", "Formal Wear",
                    "School Wear"],
  "Niche": ["Aviation", "Aviation Pins"],
};
// ------------------------------------------------------------------

interface Brand {
  id: string;
  name: string;
  slug?: string;
  is_active?: boolean;
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
    type?: string;
    value?: number;
  }>>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);

  // ---- Dynamic categories from DB (Admin > Categories panel).
  //      If the `categories` table is missing or empty, fall back to the
  //      hardcoded defaults bundled with the component so the form still works.
  interface DynamicCategory {
    name: string;
    group_name: string;
    is_top_level?: boolean;
    is_active?: boolean;
    display_order?: number;
  }
  const [dynamicCategories, setDynamicCategories] = useState<DynamicCategory[] | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Resolved category pickers (use DB if available, otherwise hardcoded fallback)
  const effectiveALL_CATEGORIES: string[] = (() => {
    if (dynamicCategories && dynamicCategories.length > 0) {
      return Array.from(new Set(dynamicCategories.filter(c => c.is_active !== false).map(c => c.name)));
    }
    return ALL_CATEGORIES;
  })();

  const effectiveCATEGORY_GROUPS: Record<string, string[]> = (() => {
    if (dynamicCategories && dynamicCategories.length > 0) {
      const groups: Record<string, string[]> = {};
      // stable group order = GROUP_CHOICES-first, then any extras found
      const GROUP_CHOICES = ["Audience", "Product Type", "Shoe Styles", "Style / Occasion", "Niche", "Style/Occasion"];
      const ordered: string[] = [];
      for (const g of GROUP_CHOICES) if (groups[g] === undefined) { groups[g] = []; ordered.push(g); }
      for (const c of dynamicCategories) {
        if (c.is_active === false) continue;
        const key = c.group_name || "Product Type";
        if (groups[key] === undefined) { groups[key] = []; ordered.push(key); }
        groups[key].push(c.name);
      }
      // sort each group by display_order then name
      const orderMap: Record<string, number> = Object.fromEntries(
        dynamicCategories.filter(c => !c.is_active || c.is_active === true).map(c => [c.name, c.display_order ?? 9999])
      );
      for (const k of Object.keys(groups)) {
        groups[k] = groups[k].sort((a, b) => {
          const oa = orderMap[a] ?? 9999;
          const ob = orderMap[b] ?? 9999;
          if (oa !== ob) return oa - ob;
          return a.localeCompare(b);
        });
      }
      // Remove empty groups that only existed from GROUP_CHOICES scaffolding
      const cleaned: Record<string, string[]> = {};
      for (const k of ordered) if (groups[k] && groups[k].length > 0) cleaned[k] = groups[k];
      return cleaned;
    }
    return CATEGORY_GROUPS;
  })();

  const effectiveTOP_LEVEL_CATEGORIES: string[] = (() => {
    if (dynamicCategories && dynamicCategories.length > 0) {
      const flagged = dynamicCategories
        .filter(c => c.is_active !== false && c.is_top_level === true)
        .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
        .map(c => c.name);
      if (flagged.length > 0) return flagged;
    }
    return TOP_LEVEL_CATEGORIES;
  })();

  // Fetch dynamic categories from the categories table
  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("categories")
          .select("name, group_name, is_top_level, is_active, display_order")
          .order("group_name", { ascending: true })
          .order("display_order", { ascending: true })
          .order("name", { ascending: true });
        if (cancelled) return;
        if (error) throw error;
        setDynamicCategories((data as DynamicCategory[]) || null);
      } catch (e) {
        // categories table may not exist yet — fall back to hardcoded (null triggers fallback)
        setDynamicCategories(null);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    };
    void fetchCategories();
    return () => { cancelled = true; };
  }, []);

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantInput, setVariantInput] = useState<ProductVariant>({
    name: "",
    color: "",
    size: "",
    sku: "",
    stock: 0,
    image_url: "",
    hex: "#000000",
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);

  // ---- Add New Brand dialog state
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);

  // Smart Color Detection
  const colorMap: Record<string, string> = {
    "red": "#EF4444", "blue": "#3B82F6", "green": "#22C55E",
    "black": "#000000", "white": "#FFFFFF", "yellow": "#EAB308",
    "purple": "#A855F7", "orange": "#F97316", "pink": "#EC4899",
    "gray": "#6B7280", "navy": "#1E3A8A", "teal": "#14B8A6",
    "cyan": "#06B6D4", "indigo": "#6366F1", "lime": "#84CC16",
    "emerald": "#10B981", "rose": "#F43F5E", "sky": "#0EA5E9",
    "amber": "#F59E0B", "violet": "#8B5CF6", "fuchsia": "#D946EF",
    "slate": "#64748B", "zinc": "#71717A", "neutral": "#737373",
    "stone": "#78716C", "brown": "#78350F"
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    const lowerColor = color.toLowerCase().trim();
    let hex = variantInput.hex || "#000000";

    if (colorMap[lowerColor]) {
      hex = colorMap[lowerColor];
    }

    setVariantInput(prev => ({
      ...prev,
      color,
      hex,
      name: prev.size ? `${color} - ${prev.size}` : color
    }));
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = e.target.value;
    setVariantInput(prev => ({
      ...prev,
      size,
      name: size ? `${prev.color} - ${size}` : prev.color
    }));
  };

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: ["Women"],
    brandId: "",
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

  // Fetch active brands on mount (admin + customer forms both use)
  useEffect(() => {
    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("brands")
          .select("id, name, slug, is_active")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .order("name", { ascending: true });
        if (!error && data) setBrands(data as Brand[]);
      } catch (e) {
        console.warn("Brands table not ready yet — skip (run SQL migration + seed first):", e);
      } finally {
        setBrandsLoading(false);
      }
    };
    void fetchBrands();
  }, []);

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        category: Array.isArray(initialData.category) ? initialData.category : initialData.category ? [initialData.category] : ["Women"],
        brandId: initialData.brand_id ?? "",
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

      // Load variants if they exist in initialData
      if (initialData.variants && initialData.variants.length > 0) {
        const loadedVariants = initialData.variants.map((v) => ({
          ...v,
          color: v.attributes?.color || v.name || "",
          size: v.attributes?.size || "",
          hex: v.attributes?.hex || v.hex || "#000000",
          name: v.name || `${v.attributes?.color ?? ""}${v.attributes?.size ? ` - ${v.attributes.size}` : ""}`,
        } as ProductVariant));
        setVariants(loadedVariants);
        setHasVariants(true);
      }
    }
  }, [initialData]);

  // Effect: Calculate remaining stock and validate
  const totalVariantStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const remainingStock = (parseInt(formData.stock) || 0) - totalVariantStock;

  // Auto-sync images from variants if enabled
  useEffect(() => {
    if (hasVariants) {
      // Collect unique non-empty images from variants
      const variantImages = variants
        .map(v => v.image_url)
        .filter((url): url is string => !!url);

      // Only update if different to avoid loops/jitters
      if (JSON.stringify(variantImages) !== JSON.stringify(images)) {
        setImages(variantImages);
      }
    }
  }, [variants, hasVariants]);

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
      if (Array.isArray(formData.category)) {
        formData.category.forEach(cat => generatedTags.add(cat.toLowerCase()));
      }

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
  }, [formData.title, formData.description, formData.category, isEditing]);

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

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const supabase = createClient();
    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `variants/${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage
        .from("NadineKollections")
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("NadineKollections")
        .getPublicUrl(filePath);

      setVariantInput(prev => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success("Variant image uploaded");
    } catch (error) {
      console.error("Variant upload error:", error);
      toast.error("Failed to upload variant image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddVariant = () => {
    if (!variantInput.color) {
      toast.error("Please enter a color name");
      return;
    }

    setVariants([...variants, { ...variantInput, id: Math.random().toString(36).substr(2, 9) }]);

    // Auto-add variant image to main gallery if present and unique
    if (variantInput.image_url && !images.includes(variantInput.image_url)) {
      setImages(prev => [...prev, variantInput.image_url!]);
    }

    setVariantInput({
      name: "",
      color: "",
      size: "",
      sku: "",
      stock: 0,
      image_url: "",
      hex: "#000000",
    });
    // Reset file input if possible via ref, or let user do it
    toast.success("Variant added");
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
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

  // ---- Save new brand to DB & immediately select it
  const handleSaveNewBrand = async () => {
    const name = newBrandName.trim();
    if (!name) return;
    setSavingBrand(true);
    try {
      const supabase = createClient();
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // 1. Insert — rely on DB unique constraint.
      const { data: inserted, error: insertError } = await supabase
        .from("brands")
        .insert({ name, slug, is_active: true })
        .select("id, name, slug, is_active")
        .maybeSingle();

      if (insertError && !insertError.message?.includes("duplicate")) {
        throw insertError;
      }

      if (inserted) {
        setBrands(prev => [...prev, inserted as Brand]);
        setFormData(prev => ({ ...prev, brandId: inserted.id }));
        toast.success(`Brand "${name}" added`);
      } else {
        // Conflict: brand with this name already exists. Select it.
        const { data: existing } = await supabase
          .from("brands")
          .select("id, name, slug, is_active")
          .ilike("name", name)
          .limit(1)
          .maybeSingle();
        if (existing) {
          setBrands(prev => prev.find(b => b.id === existing.id) ? prev : [...prev, existing as Brand]);
          setFormData(prev => ({ ...prev, brandId: existing.id }));
          toast.success(`Brand "${name}" already exists — selected it`);
        }
      }

      setNewBrandName("");
      setIsBrandDialogOpen(false);
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error("Error creating brand:", e);
      toast.error(err?.message || "Failed to save brand");
    } finally {
      setSavingBrand(false);
    }
  };

  const calculateDiscount = () => {
    const original = parseFloat(formData.originalPrice);
    const sale = parseFloat(formData.salePrice);
    if (original && sale && original > sale) {
      return Math.round(((original - sale) / original) * 100);
    }
    return 0;
  };

  const generateSKU = (title?: string, category?: string[]) => {
    const cat = (category ?? formData.category)[0]?.substring(0, 3).toUpperCase() || "GEN";
    const ttl = (title ?? formData.title)
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "X") || "XXX";
    const randomNum = Math.floor(1000 + Math.random() * 90000); // 5 digit random for lower collision chance
    return `${cat}-${ttl}-${randomNum}`;
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

      // If no SKU provided, generate a unique one to avoid null-uniqueness issues
      const skuValue = formData.sku?.trim() || generateSKU(formData.title, formData.category);

      const productData = {
        title: formData.title,
        slug: isEditing ? undefined : slug,
        description: formData.description || null,
        category: formData.category,
        brand_id: formData.brandId || null,
        tags: formData.tags,
        original_price: originalPrice || salePrice,
        sale_price: salePrice,
        price: salePrice,
        stock: parseInt(formData.stock) || 0,
        sku: skuValue,
        images: images,
        promotion_id: formData.promotionId || null,
        seo_meta: {
          title: formData.metaTitle || formData.title,
          description: formData.metaDescription || formData.description,
        },
        is_featured: formData.isFeatured,
        is_active: formData.isActive,
      };

      let error;
      let productId = initialData?.id;
      let retryCount = 0;
      const MAX_RETRIES = 3;

      // Retry loop to handle rare SKU collisions on auto-generated SKUs
      while (retryCount <= MAX_RETRIES) {
        if (isEditing && initialData?.id) {
          const { error: updateError } = await supabase
            .from("products")
            .update(productData)
            .eq("id", initialData.id);
          error = updateError;
          break;
        } else {
          const { data: newProduct, error: insertError } = await supabase
            .from("products")
            .insert(productData)
            .select()
            .single();

          error = insertError;
          if (newProduct) {
            productId = newProduct.id;
            break;
          }

          // If SKU collision and SKU was auto-generated, retry with a new one
          const isSkuCollision = insertError?.code === "23505" ||
            insertError?.message?.includes("products_sku_key") ||
            insertError?.message?.includes("sku");

          if (isSkuCollision && !formData.sku?.trim() && retryCount < MAX_RETRIES) {
            retryCount++;
            (productData as any).sku = generateSKU(formData.title, formData.category);
            continue;
          }
          break;
        }
      }

      if (error) {
        const isSkuError = error?.code === "23505" ||
          error?.message?.includes("products_sku_key") ||
          error?.message?.includes("sku");
        if (isSkuError && formData.sku?.trim()) {
          throw new Error("This SKU is already used by another product. Please change the SKU or leave it empty to auto-generate one.");
        }
        throw error;
      }

      // Handle Variants
      if (productId) {
        // First delete existing variants if editing (simple replace strategy)
        if (isEditing) {
          const { error: deleteError } = await supabase
            .from("product_variants")
            .delete()
            .eq("product_id", productId);

          if (deleteError) console.error("Error deleting old variants:", deleteError);
        }

        // Insert new variants
        if (hasVariants && variants.length > 0) {
          const variantsToInsert = variants.map(v => ({
            product_id: productId,
            name: v.name,
            sku: v.sku || null,
            inventory_count: v.stock,
            image_url: v.image_url || null,
            attributes: { color: v.color, size: v.size, hex: v.hex }
          }));

          const { error: variantsError } = await supabase
            .from("product_variants")
            .insert(variantsToInsert);

          if (variantsError) {
            console.error("Error saving variants:", variantsError);
            toast.error("Product saved but variants failed to save");
          }
        }
      }

      toast.success(isEditing ? "Product updated successfully!" : "Product created successfully!");

      // Clear draft
      if (!isEditing) {
        localStorage.removeItem("productFormDraft");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving product:", error);
      const message = error instanceof Error ? error.message : "Failed to save product";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const discount = calculateDiscount();

  return (
    <div className="max-w-5xl mx-auto space-y-4 px-0">
      {/* Page Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">{isEditing ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {isEditing ? "Update product details and inventory." : "Create a new product for your store."}
          </p>
        </div>
        {/* Action buttons row — scrollable on tiny screens */}
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
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
                  category={formData.category.length > 0 ? formData.category : ["Uncategorized"]}
                  brand_name={brands.find((b) => b.id === formData.brandId)?.name ?? null}
                  stock={parseInt(formData.stock) || 0}
                  isNew={!isEditing}
                  isActive={formData.isActive}
                />
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="text-xs sm:text-sm h-8 sm:h-9">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isLoading || isUploading}
            className="text-xs sm:text-sm h-8 sm:h-9 ml-auto"
          >
            {isLoading ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</>
            ) : isUploading ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading...</>
            ) : isEditing ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
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

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label htmlFor="category" className="text-xs sm:text-sm">
                      Categories * <span className="text-[10px] sm:text-xs text-text-secondary font-normal">(select multiple)</span>
                    </Label>
                    {categoriesLoading ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-text-muted">
                        <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />Syncing…
                      </Badge>
                    ) : dynamicCategories && dynamicCategories.length > 0 ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/30">
                        <Tag className="h-3 w-3 inline mr-1" />
                        {dynamicCategories.filter(c => c.is_active !== false).length} tags
                      </Badge>
                    ) : null}
                  </div>
                  <span className="text-[10px] text-text-secondary hidden sm:block">
                    Tip: Pick Audience + Product Type + Style
                  </span>
                </div>
                <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
                  {Object.entries(effectiveCATEGORY_GROUPS).map(([groupName, options]) => (
                    <div key={groupName}>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-2">
                        {groupName}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {options.map((cat) => {
                          const checked = Array.isArray(formData.category) && formData.category.includes(cat);
                          return (
                            <button
                              type="button"
                              key={cat}
                              onClick={() =>
                                setFormData((prev) => {
                                  const has = prev.category.includes(cat);
                                  return {
                                    ...prev,
                                    category: has
                                      ? prev.category.filter((c) => c !== cat)
                                      : [...prev.category, cat],
                                  };
                                })
                              }
                              className={
                                "px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors " +
                                (checked
                                  ? "bg-primary text-white border-primary shadow-sm"
                                  : "bg-background text-text-secondary border-border-light hover:border-primary hover:text-primary")
                              }
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border-light/60">
                    <p className="text-xs text-text-secondary">
                      Selected:{" "}
                      <span className="font-medium text-text-primary">
                        {formData.category.length > 0 ? formData.category.join(", ") : "none"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="brand">
                    Brand <span className="text-xs text-text-secondary font-normal">(optional)</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIsBrandDialogOpen(true)}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New Brand
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    id="brand"
                    className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    disabled={brandsLoading}
                  >
                    <option value="">No brand</option>
                    {brands.length === 0 && !brandsLoading && (
                      <option value="" disabled>
                        — No brands yet. Click "Add New Brand" above. —
                      </option>
                    )}
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {brandsLoading && (
                    <div className="h-10 w-10 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>

              <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle>Add New Brand</DialogTitle>
                    <DialogDescription>
                      Create a new brand (Piccadilly, Clarks, American Eagle, M&S, etc.). Saved globally — immediately available in the selector above.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="newBrandName">Brand name *</Label>
                      <Input
                        id="newBrandName"
                        autoFocus
                        placeholder="e.g. Clarks"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void handleSaveNewBrand()}
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsBrandDialogOpen(false);
                        setNewBrandName("");
                      }}
                      disabled={savingBrand}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => void handleSaveNewBrand()} disabled={savingBrand || !newBrandName.trim()}>
                      {savingBrand ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Brand"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price row: 2-col on mobile (orig + sale), discount on its own line */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="originalPrice" className="text-xs sm:text-sm">Original Price (₦)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  placeholder="0.00"
                  className="h-9 text-sm"
                />
                <p className="text-[10px] text-text-secondary hidden sm:block">Leave empty if no discount</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="salePrice" className="text-xs sm:text-sm">Sale Price (₦) *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  required
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="0.00"
                  className="h-9 text-sm"
                />
                <p className="text-[10px] text-text-secondary hidden sm:block">Current selling price</p>
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs sm:text-sm">Discount</Label>
                <div className="h-9 flex items-center">
                  {discount > 0 ? (
                    <Badge variant="default" className="text-sm sm:text-base">
                      {discount}% OFF
                    </Badge>
                  ) : (
                    <span className="text-xs sm:text-sm text-text-secondary">No discount</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="stock" className="text-xs sm:text-sm">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  inputMode="numeric"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  className={`h-9 text-sm ${hasVariants ? "border-primary/50" : ""}`}
                />
                {hasVariants && (
                  <div className={`text-[10px] sm:text-xs mt-1 font-medium ${remainingStock < 0 ? "text-destructive" : "text-emerald-600"}`}>
                    {remainingStock >= 0
                      ? `${remainingStock} remaining to assign`
                      : `${Math.abs(remainingStock)} over assigned!`}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sku" className="flex items-center gap-1 text-xs sm:text-sm">
                    SKU
                    <span className="font-normal text-text-secondary">(optional)</span>
                    <div title="Unique inventory code. Leave empty to auto-generate." className="cursor-help text-text-secondary">
                      <Info className="h-3.5 w-3.5" />
                    </div>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] sm:text-xs text-primary gap-1 px-2"
                    onClick={() => setFormData({ ...formData, sku: generateSKU() })}
                  >
                    <Wand2 className="h-3 w-3" /> Generate
                  </Button>
                </div>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Auto-generated if empty"
                  className="h-9 text-sm"
                />
                <p className="text-[10px] text-text-secondary">
                  Leave empty — a unique SKU will be auto-generated.
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="promotion" className="text-xs sm:text-sm">Apply Promotion (Optional)</Label>
                <select
                  id="promotion"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.promotionId}
                  onChange={(e) => setFormData({ ...formData, promotionId: e.target.value })}
                >
                  <option value="">No promotion</option>
                  {promotions.map((promo) => (
                    <option key={promo.id} value={promo.id}>
                      {promo.code} - {promo.type === "percentage" ? `${promo.value}%` : `₦${promo.value}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants Manager */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Variants</span>
                <span className="text-xs font-normal text-text-secondary hidden sm:inline">(Colors / Sizes)</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="hasVariants" className="text-xs sm:text-sm font-normal text-text-secondary cursor-pointer">Enable?</Label>
                <input
                  type="checkbox"
                  id="hasVariants"
                  className="toggle-checkbox h-4 w-4 sm:h-5 sm:w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                />
              </div>
            </CardTitle>
          </CardHeader>
          {hasVariants && (
            <CardContent className="space-y-4">
              {/* Variant input grid — 2-col on mobile, wraps naturally */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label className="text-xs sm:text-sm">Color *</Label>
                  <div className="relative flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        placeholder="e.g. Red, Navy"
                        value={variantInput.color}
                        onChange={handleColorChange}
                        className="pl-8 h-9 text-sm"
                      />
                      <div
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border shadow-sm flex-shrink-0"
                        style={{ backgroundColor: variantInput.hex || '#000000' }}
                      />
                    </div>
                    <div title="Pick exact color" className="flex-shrink-0">
                      <Input
                        type="color"
                        className="w-9 h-9 p-0.5 cursor-pointer"
                        value={variantInput.hex || '#000000'}
                        onChange={(e) => setVariantInput({ ...variantInput, hex: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Size</Label>
                  <Input
                    placeholder="e.g. XL, 42"
                    value={variantInput.size}
                    onChange={handleSizeChange}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Stock</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={variantInput.stock}
                    onChange={(e) => setVariantInput({ ...variantInput, stock: parseInt(e.target.value) || 0 })}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">SKU (optional)</Label>
                  <Input
                    placeholder="Auto"
                    value={variantInput.sku}
                    onChange={(e) => setVariantInput({ ...variantInput, sku: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Image</Label>
                  <div className="flex items-center gap-2">
                    {variantInput.image_url ? (
                      <div className="relative h-9 w-9 rounded border overflow-hidden flex-shrink-0">
                        <Image src={variantInput.image_url} alt="Variant" fill className="object-cover" />
                        <button
                          type="button"
                          className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white"
                          onClick={() => setVariantInput({ ...variantInput, image_url: "" })}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-1.5 cursor-pointer h-9 px-3 rounded-md border border-input text-xs text-text-secondary hover:bg-muted/50 transition-colors w-full">
                        <Upload className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{isUploading ? "Uploading..." : "Upload"}</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleVariantImageUpload}
                          disabled={isUploading}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddVariant}
                    disabled={!variantInput.color || isUploading}
                    size="sm"
                    className="w-full h-9 text-xs sm:text-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                  </Button>
                </div>
              </div>

              {/* Variants list */}
              <div className="border rounded-lg divide-y overflow-hidden">
                {variants.length === 0 ? (
                  <div className="p-6 text-center text-xs sm:text-sm text-text-secondary">
                    No variants added yet. Fill in the fields above and click Add Variant.
                  </div>
                ) : (
                  variants.map((variant, idx) => (
                    <div key={idx} className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-muted/30 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded border flex-shrink-0 relative overflow-hidden"
                          style={variant.image_url ? {} : { backgroundColor: variant.hex || '#ccc' }}
                        >
                          {variant.image_url ? (
                            <Image src={variant.image_url} alt={variant.name} fill className="object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">
                            {variant.color}{variant.size ? ` — ${variant.size}` : ""}
                          </p>
                          <p className="text-[10px] sm:text-xs text-text-secondary">
                            Stock: {variant.stock}{variant.sku ? ` · SKU: ${variant.sku}` : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-destructive hover:text-destructive flex-shrink-0 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Images - Hidden if Variants Enabled (Source of Truth is Variants) */}
        {!hasVariants && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                Product Images *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
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
        )}

        {/* Variant Images Preview (When hasVariants is True) */}
        {hasVariants && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Product Images (From Variants)
              </CardTitle>
              <p className="text-sm text-text-secondary font-normal">
                These images are automatically collected from your variants. The first image will be the primary one.
              </p>
            </CardHeader>
            <CardContent>
              {images.length === 0 ? (
                <p className="text-sm text-text-secondary italic">Add images to your variants above to populate the gallery.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                      <Image src={img} alt="Variant view" fill className="object-cover" />
                      {idx === 0 && <span className="absolute top-2 left-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">Primary</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tags & SEO */}
        < Card >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
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
        </Card >
      </form >
    </div >
  );
}
