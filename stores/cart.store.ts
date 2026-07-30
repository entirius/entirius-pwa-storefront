import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Price } from "@/utils/NORMALIZERS/price.normalizer";

type CartItem = {
  sku: string;
  name: string;
  url_key: string;
  price: Price;
  media: { uri: string; width: number; height: number }[][];
  quantity: number;
};

type CartStore = {
  items: Record<string, CartItem>;
  add: (item: Omit<CartItem, "quantity">, qty: number, max: number) => void;
  setQty: (sku: string, qty: number, max: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  has: (sku: string) => boolean;
  count: () => number;
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

const flat_storage = {
  getItem: (name: string) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    return { state: { items: JSON.parse(raw) }, version: 0 };
  },
  setItem: (name: string, value: { state: { items: Record<string, CartItem> } }) => {
    localStorage.setItem(name, JSON.stringify(value.state.items));
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: {},
      add: (item, qty, max) =>
        set((s) => {
          const existing = s.items[item.sku];
          const quantity = clamp((existing?.quantity ?? 0) + qty, 1, max);
          return { items: { ...s.items, [item.sku]: { ...item, quantity } } };
        }),
      setQty: (sku, qty, max) =>
        set((s) => {
          const existing = s.items[sku];
          if (!existing) return s;
          const next = { ...s.items };
          if (qty <= 0) {
            delete next[sku];
            return { items: next };
          }
          next[sku] = { ...existing, quantity: clamp(qty, 1, max) };
          return { items: next };
        }),
      remove: (sku) =>
        set((s) => {
          const next = { ...s.items };
          delete next[sku];
          return { items: next };
        }),
      clear: () => set({ items: {} }),
      has: (sku) => sku in get().items,
      count: () =>
        Object.values(get().items).reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "CART", storage: flat_storage }
  )
);

// Cross-tab freshness: the `storage` event fires in OTHER tabs when localStorage
// changes. Re-read the persisted cart so every open tab stays in sync.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "CART") useCartStore.persist.rehydrate();
  });
}

export type { CartItem };
