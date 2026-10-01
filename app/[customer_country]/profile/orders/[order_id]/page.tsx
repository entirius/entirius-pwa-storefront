import { OrderDetail } from "./_components/order-detail.client";

interface Props {
  params: Promise<{ order_id: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { order_id } = await params;
  return <OrderDetail order_id={order_id} />;
}
