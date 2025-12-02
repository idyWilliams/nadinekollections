"use client";

import { Suspense } from "react";
import { useWishlistStore } from "@/lib/store/wishlist";
import { ProductCard } from "@/components/customer/ProductCard";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import Link from "next/link";

function WishlistContent() {
  const { items } = useWishlistStore();

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-3xl font-bold">My Wishlist</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-xl border border-border-light">
            <Heart className="h-16 w-16 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-text-secondary mb-6">
              Save items you love to your wishlist and revisit them anytime.
            </p>
            <Link href="/">
              <Button size="lg" className="shadow-glow">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                title={item.title}
                slug={item.slug}
                price={item.price}
                image={item.image}
                category={item.category}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <WishlistContent />
    </Suspense>
  );
}
