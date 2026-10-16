// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cookies } from "next/headers";
import type { COOKIE_ACCESS } from "../api";

export async function make_server_access(): Promise<COOKIE_ACCESS> {
  const store = await cookies(); // next/headers — server side only
  return {
    get: (name) => store.get(name)?.value ?? null,
    set: (name, value) => store.set(name, value),
    delete: (name) => store.delete(name),
  };
}