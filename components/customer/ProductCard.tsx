"use client";

import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart";

import Image from "next/image";
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
  isSale,
  stock,
}: ProductCardProps) {
  const { addItem } = useCartStore();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-2xl bg-surface p-4 shadow-card hover:shadow-hover"
    >
      {/* Badges */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
        {isNew && <Badge variant="secondary">New</Badge>}
        {isSale && <Badge variant="destructive">Sale</Badge>}
        {stock && stock < 10 && (
          <Badge variant="warning">Only {stock} left!</Badge>
        )}
      </div>

      {/* Wishlist Button */}
      <button className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-text-secondary backdrop-blur-sm transition-colors hover:bg-white hover:text-error">
        <Heart className="h-5 w-5" />
      </button>

      {/* Image */}
      <Link href={`/shop/${category.toLowerCase()}/${slug}`}>
        <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="space-y-2">
        <p className="text-xs text-text-muted uppercase tracking-wider">
          {category}
        </p>
        <Link href={`/shop/${category.toLowerCase()}/${slug}`}>
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
      </div>

      {/* Quick Add Button */}
      <div className="mt-4">
        <Button
          className="w-full gap-2"
          size="sm"
          onClick={() => {
            addItem({
              id,
              title,
              price: salePrice || price,
              image,
              quantity: 1,
            });
            toast.success(`Added ${title} to cart`);
          }}
        >
          <ShoppingBag className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </motion.div>
  );
}
