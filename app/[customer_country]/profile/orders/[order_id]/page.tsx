// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { OrderDetail } from "./_components/order-detail.client";

interface Props {
  params: Promise<{ order_id: string }>;
}

// Not for search engines; the title names the page in the browser tab ("… | site").
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await get_i18n();
  return {
    title: t("orders.title"),
    robots: { index: false },
  };
}

export default async function OrderPage({ params }: Props) {
  const { order_id } = await params;
  return <OrderDetail order_id={order_id} />;
}
