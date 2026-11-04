// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cookies } from "next/headers";
import { make_server_access } from "@/API/access/api.server-access";
import { create_api } from "@/API/api.context";
import { API_USER_TOKEN_REFRESH_ROUTE } from "@/API/api.routes";
import { clear_session, set_session } from "@/lib/session.server";

type RefreshResponse = { data?: { access?: string; refresh?: string } };

// POST → new tokens for the HttpOnly refresh token, kept as the session cookies. The client API layer calls it on a
// 401. A token accounts refuses (400/401/403) ends the session: 401 and the cookies cleared. Any other failure (the
// backend down) leaves the session as it is: 502.
export async function POST() {
  const refresh = (await cookies()).get("rt")?.value;
  if (!refresh) return Response.json({ error: "no_session" }, { status: 401 });

  const api = create_api(await make_server_access());
  const [error, data] = await api.FETCH_METHOD<RefreshResponse>(API_USER_TOKEN_REFRESH_ROUTE, {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
  const tokens = data?.data;
  if (error || !tokens?.access) {
    const refused = error?.status === 400 || error?.status === 401 || error?.status === 403;
    if (!refused) return Response.json({ error: "unavailable" }, { status: 502 });
    await clear_session();
    return Response.json({ error: "refused" }, { status: 401 });
  }

  // Accounts may rotate the refresh token; without a new one the current one stays.
  await set_session({ access: tokens.access, refresh: tokens.refresh ?? refresh });
  return Response.json({ ok: true });
}
