// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { StorefrontProvider, type Storefront } from "@entirius/storefront-sdk/storefront";
import { profile_path } from "@/lib/profile-path";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { useQuickAdd } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/use-quick-add";
import { media_src } from "./media-src";
import { useOmnibus } from "./use-omnibus";
import { useProductCard } from "./use-product-card";
import { useWishlist } from "./use-wishlist";

function useLocalHref(href: string): string {
  const country = useParams()?.customer_country as string | undefined;
  return profile_path(country, href);
}

// The core's side of the SDK: what theme components get through useStorefront() and the SDK's own components.
const STOREFRONT: Storefront = {
  media_src,
  image_placeholder,
  useLocalHref,
  useWishlist,
  useProductCard,
  useQuickAdd,
  useOmnibus,
};

export function StorefrontRuntime({ children }: { children: ReactNode }) {
  return <StorefrontProvider value={STOREFRONT}>{children}</StorefrontProvider>;
}
