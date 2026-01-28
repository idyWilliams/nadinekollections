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
  const { addItem } = useCartStore();
  const searchParams = useSearchParams();

  const variants = product.variants || [];

  // Normalize variants with attributes
  const normalizedVariants = variants.map((v: any) => ({
    ...v,
    stock: v.inventory_count ?? v.stock ?? 0,
    hex: v.attributes?.hex || v.hex || '#000000',
    color: v.attributes?.color || (v.attributes?.hex ? v.name : null),
    size: v.attributes?.size || null
  }));

  const uniqueColors = Array.from(new Set(normalizedVariants.filter(v => v.color).map(v => JSON.stringify({ name: v.color, hex: v.hex }))))
    .map(s => JSON.parse(s as string));

  const uniqueSizes = Array.from(new Set(normalizedVariants.filter(v => v.size).map(v => v.size)));

  // State
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Initialize from URL or defaults
  useEffect(() => {
    const variantId = searchParams.get('variantId');
    if (variantId && normalizedVariants.length > 0) {
      const found = normalizedVariants.find((v: any) => v.id === variantId);
      if (found) {
        if (found.color) setSelectedColor(found.color);
        if (found.size) setSelectedSize(found.size);
      }
    }
  }, [searchParams]);

  // Derived Selection
  const selectedVariant = normalizedVariants.find(v => {
    const colorMatch = !uniqueColors.length || v.color === selectedColor;
    const sizeMatch = !uniqueSizes.length || v.size === selectedSize;
    return colorMatch && sizeMatch;
  });

  // Image Logic: If color selected, try to find image for that color
  const colorImageVariant = selectedColor
    ? normalizedVariants.find(v => v.color === selectedColor && v.image_url)
    : null;

  const currentImage = colorImageVariant?.image_url
    ? colorImageVariant.image_url
    : (product.images && product.images[selectedImageIndex]) || product.primary_image;

  // Stock Logic
  const hasVariants = normalizedVariants.length > 0;
  const currentStock = selectedVariant
    ? selectedVariant.stock
    : (hasVariants ? 0 : product.stock); // If variants exist but not selected, effectively 0 for "Add to Cart" purposes until selected
  const isOutOfStock = currentStock === 0;

  const handleAddToCart = () => {
    if (hasVariants) {
      if (uniqueColors.length > 0 && !selectedColor) {
        toast.error("Please select a color");
        return;
      }
      if (uniqueSizes.length > 0 && !selectedSize) {
        toast.error("Please select a size");
        return;
      }
      if (!selectedVariant) {
        toast.error("Selected combination unavailable");
        return;
      }
    }

    addItem({
      id: product.id,
      title: `${product.title}${selectedVariant ? ` - ${selectedVariant.color} ${selectedVariant.size ? `/ ${selectedVariant.size}` : ''}` : ''}`,
      price: product.sale_price || product.price,
      image: currentImage,
      quantity: quantity,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name || `${selectedColor} ${selectedSize}`
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

        {/* Thumbnail Gallery */}
        {imagesList.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {imagesList.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedImageIndex(idx);
                  // Optional: Reset color to let user set image manually?
                  // Or just assume this overrides color image until color clicked again.
                  setSelectedColor(null);
                }}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${selectedImageIndex === idx && !selectedColor
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
        {hasVariants && (
          <div className="space-y-6 pt-4 border-t border-border-light">

            {/* Colors */}
            {uniqueColors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Select Color:</span>
                  {selectedColor && (
                    <span className="text-sm text-text-secondary font-medium">{selectedColor}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map((c: any) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(selectedColor === c.name ? null : c.name)}
                      className={`
                        relative w-10 h-10 rounded-full border-2 shadow-md transition-all hover:scale-110
                        ${selectedColor === c.name
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-gray-200 hover:border-primary/50"}
                      `}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                      aria-label={`Select ${c.name} color`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {uniqueSizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Select Size:</span>
                  <Link href="/size-guide" className="text-xs text-primary hover:underline">Size Guide</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size: any) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                      className={`
                        min-w-[3rem] h-10 px-3 rounded-md border font-medium text-sm transition-all
                        ${selectedSize === size
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-text-primary border-gray-200 hover:border-primary/50 hover:bg-gray-50"}
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(selectedVariant) && (
              <p className="text-xs text-text-secondary bg-gray-50 p-2 rounded inline-block">
                SKU: {selectedVariant.sku || "N/A"} • {selectedVariant.stock} items left
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
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100 transition-colors"
                disabled={hasVariants ? !selectedVariant || quantity >= currentStock : quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1 gap-2 text-lg h-14"
              onClick={handleAddToCart}
              disabled={(hasVariants && !selectedVariant) || isOutOfStock}
            >
              <ShoppingBag className="h-5 w-5" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
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
