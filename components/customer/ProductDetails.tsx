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

  // Effect: Check URL for pre-selected variant
  useEffect(() => {
    const variantId = searchParams.get('variantId');
    if (variantId && variants.length > 0) {
      const found = variants.find((v: any) => v.id === variantId);
      if (found) {
        setSelectedVariant(found);
      }
    } else if (variants.length > 0 && !selectedVariant) {
      // Optional: Auto-select first variant if enforcing
      // setSelectedVariant(variants[0]);
    }
  }, [searchParams, variants]);

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
    if (variants.length > 0 && !selectedVariant) {
      toast.error("Please select a valid option (e.g. Color)");
      return;
    }

    addItem({
      id: product.id,
      title: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ''}`,
      price: product.sale_price || product.price,
      image: selectedVariant?.image_url || product.primary_image,
      quantity: quantity,
      // variantId: selectedVariant?.id // Add this to store if needed
    });
    toast.success(`Added ${quantity} ${product.title} to cart`);
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
        {variants.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border-light">
            <span className="font-semibold block text-sm">Select Color / Option:</span>
            <div className="flex flex-wrap gap-3">
              {variants.map((variant: any) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelect(variant)}
                  className={`
                                relative px-4 py-2 border rounded-full text-sm font-medium transition-all
                                ${selectedVariant?.id === variant.id
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border-light hover:border-primary/50 text-text-primary"}
                            `}
                >
                  {variant.name}
                </button>
              ))}
            </div>
            {selectedVariant && (
              <p className="text-xs text-text-secondary">
                SKU: {selectedVariant.sku || "N/A"} • Stock: {selectedVariant.stock || product.stock}
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
              {product.stock > 0 ? `${product.stock} items in stock` : "Out of stock"}
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
