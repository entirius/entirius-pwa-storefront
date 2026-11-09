// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cookies } from "next/headers";
import { make_server_access } from "@/API/access/api.server-access";
import { create_api } from "@/API/api.context";
import { API_USER_TOKEN_BLACKLIST_ROUTE, API_USER_TOKEN_REFRESH_ROUTE } from "@/API/api.routes";
import { clear_session } from "@/lib/session.server";

type RefreshResponse = { data?: { access?: string } };

// POST → the refresh token revoked in accounts, then the session cookies cleared (the HttpOnly refresh token cannot be
// cleared from a script). A refresh that raced the logout, or a copy of the cookie, is refused afterwards. The cookies
// go whatever accounts answers.
export async function POST() {
  await revoke().catch(() => undefined);
  await clear_session();
  return new Response(null, { status: 204 });
}

// Accounts revokes a refresh token only with the customer's access token; one that expired (it lives 5 minutes) is
// renewed with the refresh token first.
async function revoke() {
  const store = await cookies();
  const refresh = store.get("rt")?.value;
  if (!refresh) return;

  const api = create_api(await make_server_access());
  const body = JSON.stringify({ refresh });
  const blacklist = async (access: string) => {
    const [error] = await api.FETCH_METHOD(API_USER_TOKEN_BLACKLIST_ROUTE, {
      method: "POST",
      body,
      headers: { Authorization: `Bearer ${access}` },
    });
    return !error;
  };

  const access = store.get("at")?.value;
  if (access && (await blacklist(access))) return;
  const [, renewed] = await api.FETCH_METHOD<RefreshResponse>(API_USER_TOKEN_REFRESH_ROUTE, { method: "POST", body });
  if (renewed?.data?.access) await blacklist(renewed.data.access);
}
