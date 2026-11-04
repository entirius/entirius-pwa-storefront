// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cookies } from "next/headers";

// The session cookies, set and cleared by the route handlers of app/session/ only: `rt` is HttpOnly, so no script
// can read it; `at` and `uid` stay readable for the client API layer (same attributes as API/access/api.client-access.ts).
const MAX_AGE = 60 * 60 * 24 * 30;
const BASE = { path: "/", maxAge: MAX_AGE, secure: true, sameSite: "lax" as const };

export async function set_session(tokens: { access: string; refresh: string; customer_id?: string }) {
  const store = await cookies();
  store.set("at", tokens.access, BASE);
  store.set("rt", tokens.refresh, { ...BASE, httpOnly: true });
  if (tokens.customer_id) store.set("uid", tokens.customer_id, BASE);
}

export async function clear_session() {
  const store = await cookies();
  for (const name of ["at", "rt", "uid"]) store.delete(name);
}
