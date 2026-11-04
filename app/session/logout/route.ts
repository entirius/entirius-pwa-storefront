// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { clear_session } from "@/lib/session.server";

// POST → the session cookies cleared; the HttpOnly refresh token cannot be cleared from a script.
export async function POST() {
  await clear_session();
  return new Response(null, { status: 204 });
}
