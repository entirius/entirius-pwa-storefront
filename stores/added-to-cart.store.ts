// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { create } from "zustand";
import type { Price } from "@/utils/NORMALIZERS/price.normalizer";

export type AddedItem = {
  sku: string;
  name: string;
  quantity: number;
  // Price of one unit, as the product shows it (rendered with price_lines).
  price: Price | null;
  image: string | null;
  // The chosen variant as "axis: option" pairs (Rozmiar: S/M); empty for a simple product.
  options?: { axis: string; value: string }[];
};

type AddedToCartStore = {
  item: AddedItem | null;
  // Bumps on every add, so the same product added twice re-opens the notice.
  key: number;
  show: (item: AddedItem) => void;
  hide: () => void;
};

// The "Added to your cart" notice under the header (no cart drawer any more).
export const useAddedToCart = create<AddedToCartStore>()((set) => ({
  item: null,
  key: 0,
  show: (item) => set((s) => ({ item, key: s.key + 1 })),
  hide: () => set({ item: null }),
}));
