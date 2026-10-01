// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { OrderDetail } from "./_components/order-detail.client";

interface Props {
  params: Promise<{ order_id: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { order_id } = await params;
  return <OrderDetail order_id={order_id} />;
}
