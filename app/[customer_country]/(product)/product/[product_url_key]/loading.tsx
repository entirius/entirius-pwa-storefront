// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Spinner } from "@/components/ui/spinner";

export default function ProductLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner className="size-8 mx-auto" />
    </div>
  );
}
