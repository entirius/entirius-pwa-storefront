// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";

// A single server API instance per request. cache() keys on argument identity,
// so this shared reference is one half of what the React-cache()d loaders
// (load_product / load_catalog / load_category) need to dedupe to a single
// network call — the other half is that they key their remaining arguments on
// primitives rather than on an options object, which they now do.
export const get_server_api = cache(async () => {
  return create_api(await make_server_access());
});
