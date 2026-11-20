// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { CartPage } from "@theme/cart/cart-page";
import { CartPageRuntime } from "./_components/cart-runtime.client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await get_i18n();
  return {
    title: t("cart.title"),
    robots: { index: false },
  };
}

export default function CartRoute() {
  return (
    <CartPageRuntime>
      <CartPage />
    </CartPageRuntime>
  );
}
