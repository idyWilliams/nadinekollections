"use client";

import React from "react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";

import { OptimizedImage } from "@/components/ui/optimized-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  isSale?: boolean;
  stock?: number;
  isActive?: boolean;
  variants?: any[]; // Using any[] temporarily to match fetched data structure
}

export function ProductCard({
  id,
  title,
  slug,
  price,
  salePrice,
  image,
  category,
  isNew,
  stock = 0,
  isActive = true,
  variants = []
}: ProductCardProps) {
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem, isInWishlist } = useWishlistStore();
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null);

  // Normalize variants: map inventory_count to stock
  const normalizedVariants = variants.map((v: any) => ({
    ...v,
    stock: v.inventory_count ?? v.stock ?? 0,
    hex: v.attributes?.hex || v.hex || '#000000'
  }));

  // Determine effective image and stock based on selection
  const displayImage = selectedVariant?.image_url || image;
  const displayStock = selectedVariant ? selectedVariant.stock : stock;
  const isOutOfStock = displayStock === 0;

  // Auto-select first variant if available? No, user requested explicit selection

  // Calculate discount percentage
  const discountPercentage = salePrice && price > salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-2xl bg-surface p-3 md:p-4 shadow-card hover:shadow-hover"
    >
      {/* Badges */}
      <div className="absolute left-3 top-3 md:left-4 md:top-4 z-10 flex flex-col gap-2 p-2">
        {isOutOfStock && <Badge variant="destructive">Out of Stock</Badge>}
        {!isActive && displayStock > 0 && <Badge variant="secondary">Unavailable</Badge>}
        {isNew && displayStock > 0 && isActive && <Badge variant="secondary">New</Badge>}
        {discountPercentage > 0 && displayStock > 0 && isActive && (
          <Badge variant="destructive" className="font-bold">
            -{discountPercentage}%
          </Badge>
        )}
        {displayStock > 0 && displayStock < 5 && isActive && (
          <Badge variant="warning">Only {displayStock} left!</Badge>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          if (isInWishlist(id)) {
            removeItem(id);
            toast.info("Removed from wishlist");
          } else {
            addToWishlist({ id, title, slug, price, image: displayImage, category });
            toast.success("Added to wishlist");
          }
        }}
        className={`absolute right-3 top-3 md:right-4 md:top-4 z-10 rounded-full m-2 p-1.5 md:p-2 backdrop-blur-sm transition-colors ${isInWishlist(id)
          ? "bg-primary text-white hover:bg-primary/90 "
          : "bg-white/80 text-text-secondary hover:bg-white hover:text-error"
          }`}
      >
        <Heart className={`h-4 w-4 ${isInWishlist(id) ? "fill-current" : ""}`} />
      </button>

      {/* Image */}
      <Link href={`/shop/${category.toLowerCase()}/${slug}${selectedVariant ? `?variantId=${selectedVariant.id}` : ''}`}>
        <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-gray-100">
          <OptimizedImage
            src={displayImage}
            alt={title}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isOutOfStock || !isActive ? "opacity-60 grayscale" : ""
              }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="space-y-2">
        <p className="text-xs text-text-muted uppercase tracking-wider">
          {category}
        </p>
        <Link href={`/shop/${category.toLowerCase()}/${slug}${selectedVariant ? `?variantId=${selectedVariant.id}` : ''}`}>
          <h3 className="line-clamp-2 text-base font-semibold text-text-primary group-hover:text-primary">
            {title}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(salePrice || price)}
          </span>
          {salePrice && (
            <span className="text-sm text-text-muted line-through">
              {formatCurrency(price)}
            </span>
          )}
        </div>

        {/* Variant/Color Dots */}
        {normalizedVariants && normalizedVariants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {normalizedVariants.map((v) => {
              const colorHex = v.hex;

              return (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariant(selectedVariant?.id === v.id ? null : v);
                  }}
                  className={`w-6 h-6 rounded-full border-2 shadow-sm transition-all hover:scale-110 ${selectedVariant?.id === v.id
                    ? 'border-primary ring-2 ring-primary ring-offset-1'
                    : 'border-gray-300 hover:border-primary'
                    }`}
                  style={{ backgroundColor: colorHex }}
                  title={`${v.name} (${v.stock} in stock)`}
                  aria-label={`Select ${v.name} color`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Button */}
      <div className="mt-4">
        <Button
          className="w-full gap-2"
          size="sm"
          disabled={isOutOfStock || !isActive}
          onClick={() => {
            if (isOutOfStock || !isActive) return;

            addItem({
              id,
              title: selectedVariant ? `${title} - ${selectedVariant.name}` : title,
              price: salePrice || price,
              image: displayImage,
              quantity: 1,
              variantId: selectedVariant?.id,
              variantName: selectedVariant?.name
            });
            toast.success(`Added ${selectedVariant ? selectedVariant.name : title} to cart`);
          }}
        >
          <ShoppingBag className="h-4 w-4" />
          {isOutOfStock ? "Out of Stock" : !isActive ? "Unavailable" : "Add to Cart"}
        </Button>
      </div>
    </motion.div>
  );
}
