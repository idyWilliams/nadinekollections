"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Heart, Minus, Plus, Share2, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ProductDetailsProps {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    sale_price?: number;
    primary_image: string;
    images?: string[];
    category: string;
    stock: number;
    variants?: unknown[]; // flexible for now
    features?: string[];
  };
}

import { useRouter, useSearchParams } from "next/navigation"; // Added imports

// ...

export function ProductDetails({ product }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null); // Track selected variant
  const { addItem } = useCartStore();
  const searchParams = useSearchParams(); // Get search params

  const variants = product.variants || [];

  // Normalize variants: map inventory_count to stock
  const normalizedVariants = variants.map((v: any) => ({
    ...v,
    stock: v.inventory_count ?? v.stock ?? 0,
    hex: v.attributes?.hex || v.hex || '#000000'
  }));

  // Effect: Check URL for pre-selected variant
  useEffect(() => {
    const variantId = searchParams.get('variantId');
    if (variantId && normalizedVariants.length > 0) {
      const found = normalizedVariants.find((v: any) => v.id === variantId);
      if (found) {
        setSelectedVariant(found);
      }
    }
  }, [searchParams, normalizedVariants]);

  // Combined images: Main product images + variant images
  // We want to make sure variant images are accessible.
  // Strategy: If a variant is selected, show its image as "selected" main image.

  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);

    // If variant has an image, find its index or add it to view?
    // Simpler approach: If variant has image, override the main display image logic
    // or just switch the selectedImageIndex to wherever that image is.
    // For now, let's treat variant image as a high priority separate display or find it in list.

    // Improved: If variant has image, force it to show.
    // We can assume the variants images might not be in the main `images` array unless added.
  };

  const currentImage = selectedVariant?.image_url
    ? selectedVariant.image_url
    : (product.images && product.images[selectedImageIndex]) || product.primary_image;

  const handleAddToCart = () => {
    if (normalizedVariants.length > 0 && !selectedVariant) {
      toast.error("Please select a color option");
      return;
    }

    addItem({
      id: product.id,
      title: `${product.title}${selectedVariant ? ` - ${selectedVariant.name}` : ''}`,
      price: product.sale_price || product.price,
      image: selectedVariant?.image_url || product.primary_image,
      quantity: quantity,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name
    });
    toast.success(`Added ${quantity} ${selectedVariant ? selectedVariant.name : product.title} to cart`);
  };

  const imagesList = product.images && product.images.length > 0 ? product.images : [product.primary_image];

  const discountPercentage = product.sale_price && product.price > product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Image Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <motion.div
          key={currentImage} // Key change triggers animation
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 border border-border-light"
        >
          <Image
            src={currentImage}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {discountPercentage > 0 && (
            <Badge variant="destructive" className="absolute top-4 left-4 text-lg font-bold px-3 py-1">
              -{discountPercentage}% OFF
            </Badge>
          )}
        </motion.div>

        {/* Thumbnail Gallery - Only show base product images for browsing, variant images show on selection */}
        {imagesList.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {imagesList.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedImageIndex(idx);
                  setSelectedVariant(null); // Reset variant selection if they specifically click a timeline thumbnail?
                  // Or keep variant selected but show this image?
                  // Let's reset variant to let them browse 'generic' photos.
                }}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${selectedImageIndex === idx && !selectedVariant
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border-light hover:border-primary/50"
                  }`}
              >
                <Image
                  src={img}
                  alt={`${product.title} view ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="100px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Try On Button */}
        <Button variant="outline" className="w-full gap-2" size="lg">
          <Sparkles className="h-5 w-5" />
          Try On Virtually
        </Button>
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <p className="text-sm text-text-secondary uppercase tracking-wider mb-2">
            {Array.isArray(product.category) ? product.category[0] : product.category}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.title}</h1>

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(product.sale_price || product.price)}
            </span>
            {product.sale_price && product.price > product.sale_price && (
              <span className="text-xl text-text-secondary line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          <p className="text-text-secondary leading-relaxed text-lg">
            {product.description}
          </p>
        </div>

        {/* Variants Selection */}
        {normalizedVariants.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border-light">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Select Color:</span>
              {selectedVariant && (
                <span className="text-sm text-text-secondary">{selectedVariant.name}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {normalizedVariants.map((variant: any) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelect(variant)}
                  className={`
                    relative w-10 h-10 rounded-full border-2 shadow-md transition-all hover:scale-110
                    ${selectedVariant?.id === variant.id
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-gray-300 hover:border-primary/50"}
                    ${variant.stock === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  style={{ backgroundColor: variant.hex }}
                  title={`${variant.name} (${variant.stock} in stock)`}
                  aria-label={`Select ${variant.name} color`}
                  disabled={variant.stock === 0}
                >
                  {variant.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 rotate-45" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {selectedVariant && (
              <p className="text-xs text-text-secondary">
                SKU: {selectedVariant.sku || "N/A"} • {selectedVariant.stock} in stock
              </p>
            )}
          </div>
        )}

        {/* Quantity & Actions */}
        <div className="space-y-6 border-t border-b border-border-light py-8">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Quantity</span>
            <div className="flex items-center rounded-md border border-border-light">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-text-muted">
              {selectedVariant
                ? `${selectedVariant.stock} items in stock`
                : product.stock > 0
                  ? `${product.stock} items in stock`
                  : "Out of stock"}
            </span>
          </div>

          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1 gap-2 text-lg h-14"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingBag className="h-5 w-5" />
              Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="h-14 w-14 p-0">
              <Heart className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="ghost" className="h-14 w-14 p-0">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="pt-4">
            <Button
              variant="secondary"
              className="w-full h-12 gap-2 text-primary font-semibold shadow-sm border border-primary/20 hover:bg-primary/5"
              onClick={() => window.location.href = `/studio?product_id=${product.id}`}
            >
              <Sparkles className="h-5 w-5" />
              Try On with Mannequin
            </Button>
          </div>
        </div>

        {/* Features */}
        {product.features && (
          <div>
            <h3 className="font-semibold mb-4">Product Features</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              {product.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
