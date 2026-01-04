"use client";

import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ProductCard } from "@/components/customer/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RecentlyViewedSectionProps {
    fallback: React.ReactNode;
}

export function RecentlyViewedSection({ fallback }: RecentlyViewedSectionProps) {
    const { getLatestProducts } = useRecentlyViewed();
    const latestProducts = getLatestProducts(4);

    if (latestProducts.length === 0) {
        return <>{fallback}</>;
    }

    return (
        <section className="py-12 md:py-20 container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
                <div>
                    <h2 className="text-3xl font-bold mb-4">Recently Viewed</h2>
                    <p className="text-text-secondary max-w-xl">
                        Pick up where you left off. Here are the items you recently explored.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {latestProducts.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={product.id}
                        title={product.title}
                        slug={product.slug}
                        price={product.price}
                        salePrice={product.salePrice}
                        image={product.image}
                        category={product.category}
                    />
                ))}
            </div>
        </section>
    );
}
