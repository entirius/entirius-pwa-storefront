// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetch_method, set_session } = vi.hoisted(() => ({ fetch_method: vi.fn(), set_session: vi.fn() }));

vi.mock("@/_CONFIG/app.config.json", () => ({ default: { CLIENT_IP_HEADER: "cf-connecting-ip" } }));
vi.mock("@/API/access/api.server-access", () => ({ make_server_access: vi.fn(async () => ({})) }));
vi.mock("@/API/api.context", () => ({ create_api: () => ({ FETCH_METHOD: fetch_method }) }));
vi.mock("@/lib/session.server", () => ({ set_session }));

import { POST } from "./route";

const login = (headers: Record<string, string> = {}) =>
  POST(
    new Request("http://shop.test/session/login", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ email: "a@example.com", password: "Secret-2026!!" }),
    }),
  );

const tokens = [undefined, { data: { access: "a", refresh: "r", customer_id: 7 } }, undefined];

beforeEach(() => {
  fetch_method.mockReset();
  set_session.mockReset();
});

describe("POST /session/login", () => {
  it("names the visitor from the configured header as X-Client-IP", async () => {
    fetch_method.mockResolvedValue(tokens);
    const res = await login({ "cf-connecting-ip": "203.0.113.7", "x-client-ip": "198.51.100.1" });
    expect(res.status).toBe(200);
    expect(fetch_method.mock.calls[0][1].headers).toEqual({ "X-Client-IP": "203.0.113.7" });
    expect(set_session).toHaveBeenCalledWith({ access: "a", refresh: "r", customer_id: "7" });
  });

  it("sends no X-Client-IP when the configured header is missing, not even the visitor's own", async () => {
    fetch_method.mockResolvedValue(tokens);
    await login({ "x-client-ip": "198.51.100.1" });
    expect(fetch_method.mock.calls[0][1].headers).toBeUndefined();
  });

  it("answers a 429 of accounts with retry_after and Retry-After", async () => {
    fetch_method.mockResolvedValue([
      { message: "throttled", status: 429 },
      undefined,
      { status: 429, headers: new Headers({ "Retry-After": "900" }) },
    ]);
    const res = await login();
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("900");
    expect(await res.json()).toEqual({ error: "throttled", retry_after: 900 });
    expect(set_session).not.toHaveBeenCalled();
  });

  it("answers a 429 without Retry-After with retry_after null", async () => {
    fetch_method.mockResolvedValue([{ message: "throttled", status: 429 }, undefined, { status: 429, headers: new Headers() }]);
    const res = await login();
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "throttled", retry_after: null });
  });

  it("keeps bad credentials as 401 and other failures as 502", async () => {
    fetch_method.mockResolvedValue([{ message: "x", status: 403 }, undefined, undefined]);
    expect((await login()).status).toBe(401);
    fetch_method.mockResolvedValue([{ message: "x", status: 500 }, undefined, undefined]);
    expect((await login()).status).toBe(502);
  });
});
