import { Suspense } from "react";
import { CheckoutSuccessClient } from "../_components/success.client";

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
