// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import app_config from "@/_CONFIG/app.config.json";
import { make_server_access } from "@/API/access/api.server-access";
import { create_api } from "@/API/api.context";
import { API_USER_LOGIN_ROUTE } from "@/API/api.routes";
import { CLIENT_IP_FORWARD_HEADER, client_ip } from "@/lib/client-ip";
import { set_session } from "@/lib/session.server";
import { retry_after_seconds } from "@/lib/throttling";
import { login_schema } from "@/utils/validation/auth.schema";

type LoginResponse = { data?: { access?: string; refresh?: string; customer_id?: string | number } };

const CLIENT_IP_HEADER = (app_config as { CLIENT_IP_HEADER?: string | null }).CLIENT_IP_HEADER ?? null;

// POST { email, password } → the customer's tokens from accounts, kept as the session cookies (`rt` HttpOnly).
// Bad credentials come back from accounts as 403 ("no_active_account"), 400/401 guarded too: 401 here. Too many
// attempts (accounts' per-address limit, access' failed-login guard) come back as 429 with `retry_after` in seconds,
// or null; any other failure 502. The body never carries a token.
export async function POST(request: Request) {
  const parsed = login_schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_credentials" }, { status: 400 });

  const visitor = client_ip(request.headers, CLIENT_IP_HEADER);
  const api = create_api(await make_server_access());
  const [error, data, meta] = await api.FETCH_METHOD<LoginResponse>(API_USER_LOGIN_ROUTE, {
    method: "POST",
    body: JSON.stringify(parsed.data),
    ...(visitor && { headers: { [CLIENT_IP_FORWARD_HEADER]: visitor } }),
  });
  if (error?.status === 429) {
    const retry_after = retry_after_seconds(meta?.headers.get("retry-after"));
    return Response.json(
      { error: "throttled", retry_after },
      { status: 429, headers: retry_after ? { "Retry-After": String(retry_after) } : undefined },
    );
  }
  const tokens = data?.data;
  if (error || !tokens?.access || !tokens.refresh) {
    const bad = error?.status === 400 || error?.status === 401 || error?.status === 403;
    return Response.json({ error: bad ? "invalid_credentials" : "unknown" }, { status: bad ? 401 : 502 });
  }

  await set_session({ access: tokens.access, refresh: tokens.refresh, customer_id: String(tokens.customer_id ?? "") });
  return Response.json({ ok: true });
}
