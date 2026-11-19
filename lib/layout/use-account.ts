// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth.provider";
import { profile_path } from "@/lib/profile-path";
import { useCartStore } from "@/stores/cart.store";

export function useAccount() {
  const { isLoggedIn, setLoggedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  return {
    logged_in: isLoggedIn,
    // After login: flip the flag and go to the profile hub.
    signed_in: () => {
      setLoggedIn(true);
      router.push(profile_path(params?.customer_country as string | undefined, "/profile"));
    },
  };
}

export const useCartCount = () => useCartStore((s) => s.count());
