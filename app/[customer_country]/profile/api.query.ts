// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { client_get_profile } from "@/lib/auth-client";

// client_get_profile builds its own client-access api internally.
export const profile_query = () => ({
  queryKey: ["profile"] as const,
  queryFn: async () => {
    const res = await client_get_profile();
    return res.ok ? res.profile : null;
  },
});
