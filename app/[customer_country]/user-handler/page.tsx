import { Suspense } from "react";
import { UserHandlerClient } from "./_components/user-handler.client";

export default function UserHandlerPage() {
  return (
    <Suspense>
      <UserHandlerClient />
    </Suspense>
  );
}
