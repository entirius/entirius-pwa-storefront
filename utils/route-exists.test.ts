// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { afterEach, describe, expect, it, vi } from "vitest";
import { route_exists } from "./route-exists";

const answer = (results: unknown[]) =>
  vi.fn<(url: string | URL) => Promise<Response>>(async () => new Response(JSON.stringify({ results }), { headers: { "content-type": "application/json" } }));

describe("route_exists", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks the API for a non-ASCII url_key encoded once", async () => {
    const fetch = answer([{ sku: "A" }]);
    vi.stubGlobal("fetch", fetch);
    expect(await route_exists(["product", "rega%C5%82-1"], "ch-encoding")).toBe(true);
    expect(String(fetch.mock.calls[0][0])).toContain("url_key=rega%C5%82-1&");
  });

  it("answers false for a key the API does not know", async () => {
    vi.stubGlobal("fetch", answer([]));
    expect(await route_exists(["product", "missing"], "ch-missing")).toBe(false);
  });

  it("leaves a malformed escape to the page", async () => {
    const fetch = answer([]);
    vi.stubGlobal("fetch", fetch);
    expect(await route_exists(["product", "bad%E0%A4%A"], "ch-malformed")).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
});
