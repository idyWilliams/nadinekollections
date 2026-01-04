"use client";

import { useEffect } from "react";
import { useRecentlyViewed, RecentlyViewedProduct } from "@/hooks/useRecentlyViewed";

interface RecentlyViewedTrackerProps {
    product: RecentlyViewedProduct;
}

export function RecentlyViewedTracker({ product }: RecentlyViewedTrackerProps) {
    const { addProduct } = useRecentlyViewed();

    useEffect(() => {
        if (product?.id) {
            addProduct(product);
        }
    }, [product, addProduct]);

    return null; // This component doesn't render anything
}
