// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Suspense } from "react";
import { UserHandlerClient } from "./_components/user-handler.client";

export default function UserHandlerPage() {
  return (
    <Suspense>
      <UserHandlerClient />
    </Suspense>
  );
}
