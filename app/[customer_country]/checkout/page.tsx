// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { CheckoutClient } from "./_components/checkout.client";

// Not for search engines; the title names the page in the browser tab ("… | site").
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await get_i18n();
  return {
    title: t("checkout.title"),
    robots: { index: false },
  };
}

export default function CheckoutPage() {
  return <CheckoutClient />;
}
