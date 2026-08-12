"use client";

import React from "react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";

import { OptimizedImage } from "@/components/ui/optimized-image";
import Link from "next/link";
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
  variants?: any[];
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

  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  const [selectedSize, setSelectedSize] = React.useState<string | null>(null);

  const selectedVariant = normalizedVariants.find(v => {
    const colorMatch = !uniqueColors.length || v.color === selectedColor;
    const sizeMatch = !uniqueSizes.length || v.size === selectedSize;
    return colorMatch && sizeMatch;
  });

  const hasVariants = normalizedVariants.length > 0;
  const displayStock = selectedVariant ? selectedVariant.stock : (hasVariants ? 0 : stock);
  const displayImage = selectedVariant?.image_url || image;
  const isOutOfStock = displayStock === 0;

  const discountPercentage = salePrice && price > salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  const cardRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl bg-surface p-3 md:p-4 shadow-card hover:shadow-hover transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1"
    >
      <div className="absolute left-3 top-3 md:left-4 md:top-4 z-10 flex flex-col gap-2 p-2">
        {isOutOfStock && hasVariants && (selectedColor || selectedSize) && <Badge variant="destructive">Out of Stock</Badge>}
        {!hasVariants && stock === 0 && <Badge variant="destructive">Out of Stock</Badge>}

        {!isActive && <Badge variant="secondary">Unavailable</Badge>}
        {isNew && isActive && <Badge variant="secondary">New</Badge>}
        {discountPercentage > 0 && isActive && (
          <Badge variant="destructive" className="font-bold">
            -{discountPercentage}%
          </Badge>
        )}
      </div>

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
        aria-label={isInWishlist(id) ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={`h-4 w-4 ${isInWishlist(id) ? "fill-current" : ""}`} />
      </button>

      <Link href={`/shop/${category.toLowerCase()}/${slug}${selectedVariant ? `?variantId=${selectedVariant.id}` : ''}`}>
        <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-gray-100">
          <OptimizedImage
            src={displayImage}
            alt={title}
            fill
            className={`object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${(hasVariants && isOutOfStock && (selectedColor || selectedSize)) || (!hasVariants && stock === 0) ? "opacity-60 grayscale" : ""
              }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
      </Link>

      <div className="space-y-2">
        <p className="text-xs text-text-muted uppercase tracking-wider">
          {category}
        </p>
        <Link href={`/shop/${category.toLowerCase()}/${slug}${selectedVariant ? `?variantId=${selectedVariant.id}` : ''}`}>
          <h3 className="line-clamp-2 text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
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

        {hasVariants && (
          <div className="space-y-2 mt-2">
            {uniqueColors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {uniqueColors.map((c: any) => (
                  <button
                    key={c.name}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedColor(selectedColor === c.name ? null : c.name);
                    }}
                    className={`w-6 h-6 rounded-full border shadow-sm transition-all hover:scale-110 ${selectedColor === c.name
                        ? 'border-primary ring-2 ring-primary ring-offset-1'
                        : 'border-transparent ring-1 ring-gray-200 hover:border-primary'
                      }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={`Select ${c.name}`}
                  />
                ))}
              </div>
            )}

            {uniqueSizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {uniqueSizes.map((size: any) => (
                  <button
                    key={size}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedSize(selectedSize === size ? null : size);
                    }}
                    className={`min-w-[24px] h-6 px-1.5 rounded text-xs font-medium border shadow-sm transition-all ${selectedSize === size
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-text-primary border-gray-200 hover:border-primary'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <Button
          className="w-full gap-2"
          size="sm"
          disabled={hasVariants && !selectedVariant ? false : (isOutOfStock || !isActive)}
          onClick={(e) => {
            e.preventDefault();

            if (hasVariants && !selectedVariant) {
              if (uniqueColors.length > 0 && !selectedColor) {
                toast.error("Please select a color");
                return;
              }
              if (uniqueSizes.length > 0 && !selectedSize) {
                toast.error("Please select a size");
                return;
              }
            }

            if (selectedVariant && selectedVariant.stock === 0) {
              toast.error("Selected option is out of stock");
              return;
            }

            if (!hasVariants && stock === 0) {
              return;
            }

            const finalId = selectedVariant ? selectedVariant.id : null;

            addItem({
              id,
              title: selectedVariant ? `${title} - ${selectedVariant.name}` : title,
              price: salePrice || price,
              image: displayImage,
              quantity: 1,
              variantId: finalId,
              variantName: selectedVariant?.name
            });
            toast.success(`Added ${selectedVariant ? selectedVariant.name : title} to cart`);
          }}
        >
          <ShoppingBag className="h-4 w-4" />
          {hasVariants && !selectedVariant
            ? "Select Options"
            : isOutOfStock
              ? "Out of Stock"
              : !isActive
                ? "Unavailable"
                : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
