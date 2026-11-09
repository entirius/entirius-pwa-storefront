// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { create } from "zustand";

type WishlistSheetStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

// Whether the wishlist sheet of the header is open: its heart button, and "View wishlist" in a notice, open it.
export const useWishlistSheet = create<WishlistSheetStore>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export const open_wishlist = () => useWishlistSheet.getState().setOpen(true);
