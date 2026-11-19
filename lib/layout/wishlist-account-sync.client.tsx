// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect } from "react";
import { useAuth } from "@/providers/auth.provider";
import { load_account_wishlist } from "@/stores/wishlist-sync";

// Signed in, the account's list replaces the device's once per page load (and after sign-in), whatever the theme
// shows of the wishlist.
export function WishlistAccountSync() {
  const { isLoggedIn } = useAuth();
  useEffect(() => {
    if (isLoggedIn) void load_account_wishlist();
  }, [isLoggedIn]);
  return null;
}
