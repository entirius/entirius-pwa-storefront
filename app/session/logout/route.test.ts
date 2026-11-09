// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));

const { POST } = await import("./route");

type Call = { url: string; authorization?: string; body?: unknown };

// Accounts as the handler sees it: `answer` decides the status of each call.
function accounts(answer: (call: Call) => number | Promise<number>) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      const call = { url: String(url), authorization: headers.Authorization, body: JSON.parse(String(init?.body)) };
      calls.push(call);
      const status = await answer(call);
      const data = call.url.includes("/tokens/refresh/") ? { access: "renewed" } : {};
      return Response.json({ data }, { status });
    }),
  );
  return calls;
}

const blacklisted = (calls: Call[]) => calls.filter((c) => c.url.includes("/tokens/blacklist/"));

describe("POST /session/logout", () => {
  beforeEach(() => {
    jar.clear();
    for (const [name, value] of [["ch", "default-europe"], ["at", "access"], ["rt", "refresh"], ["uid", "7"]]) {
      jar.set(name, value);
    }
  });
  afterEach(() => vi.unstubAllGlobals());

  const session_cleared = () => expect(["at", "rt", "uid"].filter((name) => jar.has(name))).toEqual([]);

  it("revokes the refresh token with the access token, then clears the session", async () => {
    const calls = accounts(() => 200);
    expect((await POST()).status).toBe(204);
    expect(calls).toEqual([
      expect.objectContaining({ authorization: "Bearer access", body: { refresh: "refresh" } }),
    ]);
    session_cleared();
  });

  it("renews an expired access token first", async () => {
    const calls = accounts((call) => (call.authorization === "Bearer access" ? 401 : 200));
    await POST();
    expect(blacklisted(calls).map((c) => c.authorization)).toEqual(["Bearer access", "Bearer renewed"]);
    session_cleared();
  });

  it("clears the session when accounts cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    expect((await POST()).status).toBe(204);
    session_cleared();
  });

  it("asks accounts nothing without a refresh token", async () => {
    jar.delete("rt");
    const calls = accounts(() => 200);
    expect((await POST()).status).toBe(204);
    expect(calls).toEqual([]);
    session_cleared();
  });
});
