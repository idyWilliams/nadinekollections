"use client";

import { useState, useEffect } from "react";

export interface RecentlyViewedProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice?: number;
  image: string;
  category: string;
}

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recently viewed products", e);
      }
    }
  }, []);

  const addProduct = (product: RecentlyViewedProduct) => {
    setRecentlyViewed((prev) => {
      // Remove existing occurrence if any
      const filtered = prev.filter((p) => p.id !== product.id);
      // Add to front
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const getLatestProducts = (count: number = 4) => {
    return recentlyViewed.slice(0, count);
  };

  return {
    recentlyViewed,
    addProduct,
    getLatestProducts,
  };
}
