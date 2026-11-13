// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Suspense } from "react";
import type { Metadata } from "next";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { StockAlertCancelClient } from "../_components/stock-alert-cancel.client";

// Not for search engines: the address carries the signed token from a back-in-stock mail.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await get_i18n();
  return { title: t("stockAlert.title"), robots: { index: false } };
}

export default function StockAlertCancelPage() {
  return (
    <Suspense>
      <StockAlertCancelClient />
    </Suspense>
  );
}
