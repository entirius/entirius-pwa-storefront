// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The storefront's own session endpoints (route handlers in app/session/). The refresh token lives in an HttpOnly
// cookie only they read and write; the access token and the customer id stay readable, since the browser calls the
// API directly. Outside `/api`, which a deployment may route to the backend on the same host; proxy.ts leaves them be.
// They are the storefront's own endpoints, not the backend API, so callers use plain same-origin `fetch`.
export const SESSION_LOGIN_PATH = "/session/login";
export const SESSION_REFRESH_PATH = "/session/refresh";
export const SESSION_LOGOUT_PATH = "/session/logout";
