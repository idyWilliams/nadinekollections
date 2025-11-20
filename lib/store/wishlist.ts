import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
  category: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        if (!items.find((i) => i.id === item.id)) {
          set({ items: [...items, item] });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      isInWishlist: (id) => {
        return !!get().items.find((i) => i.id === id);
      },
    }),
    {
      name: "wishlist-storage",
    }
  )
);
