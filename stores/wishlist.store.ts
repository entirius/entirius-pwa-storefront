import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Price } from "@/utils/NORMALIZERS/price.normalizer";

type WishlistItem = {
  sku: string;
  name: string;
  url_key: string;
  price: Price;
  description: string;
  media: { uri: string; width: number; height: number }[][];
};

type WishlistStore = {
  items: Record<string, WishlistItem>;
  toggle: (sku: string, item: WishlistItem) => void;
  has: (sku: string) => boolean;
  count: () => number;
};

const flat_storage = {
  getItem: (name: string) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    return { state: { items: JSON.parse(raw) }, version: 0 };
  },
  setItem: (name: string, value: { state: { items: Record<string, WishlistItem> } }) => {
    localStorage.setItem(name, JSON.stringify(value.state.items));
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: {},
      toggle: (sku, item) =>
        set((s) => {
          const next = { ...s.items };
          if (next[sku]) delete next[sku];
          else next[sku] = item;
          return { items: next };
        }),
      has: (sku) => sku in get().items,
      count: () => Object.keys(get().items).length,
    }),
    { name: "WL", storage: flat_storage }
  )
);
