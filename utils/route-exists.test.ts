// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clear_route_cache, localized_catalog_key, route_exists } from "./route-exists";

const CTX = { channel: "default-europe", language: "en", currency: "eur", country: "default" };

const answer = (results: unknown[], status = 200) =>
  vi.fn<(url: string | URL) => Promise<Response>>(
    async () => new Response(JSON.stringify({ results }), { status, headers: { "content-type": "application/json" } }),
  );

describe("route_exists", () => {
  beforeEach(() => clear_route_cache());
  afterEach(() => vi.unstubAllGlobals());

  it("asks the API for a non-ASCII url_key encoded once, with the request's profile", async () => {
    const fetch = answer([{ sku: "A" }]);
    vi.stubGlobal("fetch", fetch);
    expect(await route_exists(["product", "rega%C5%82-1"], CTX)).toBe(true);
    const url = String(fetch.mock.calls[0][0]);
    expect(url).toContain("/api/matrix/v2/default-europe/products/?");
    expect(url).toContain("url_key=rega%C5%82-1");
    expect(url).toContain("language=en");
  });

  it("answers false for a key the API does not know", async () => {
    vi.stubGlobal("fetch", answer([]));
    expect(await route_exists(["product", "missing"], CTX)).toBe(false);
    vi.stubGlobal("fetch", answer([], 404));
    expect(await route_exists(["catalog", "missing"], CTX)).toBe(false);
  });

  it("counts API trouble as existing", async () => {
    vi.stubGlobal("fetch", answer([], 500));
    expect(await route_exists(["product", "a"], CTX)).toBe(true);
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new DOMException("timeout", "TimeoutError"))));
    expect(await route_exists(["product", "b"], CTX)).toBe(true);
  });

  it("leaves a malformed escape and an unknown channel to the page", async () => {
    const fetch = answer([]);
    vi.stubGlobal("fetch", fetch);
    expect(await route_exists(["product", "bad%E0%A4%A"], CTX)).toBe(true);
    expect(await route_exists(["product", "x"], { ...CTX, channel: "../../admin" })).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shares one lookup between concurrent asks and caches the answer", async () => {
    const fetch = answer([]);
    vi.stubGlobal("fetch", fetch);
    const both = await Promise.all([route_exists(["product", "same"], CTX), route_exists(["product", "same"], CTX)]);
    expect(both).toEqual([false, false]);
    expect(await route_exists(["product", "same"], CTX)).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps at most 1000 answers, dropping the oldest", async () => {
    const fetch = answer([]);
    vi.stubGlobal("fetch", fetch);
    for (let i = 0; i <= 1000; i++) await route_exists(["product", `p${i}`], CTX);
    expect(fetch).toHaveBeenCalledTimes(1001);
    await route_exists(["product", "p1000"], CTX); // newest: cached
    expect(fetch).toHaveBeenCalledTimes(1001);
    await route_exists(["product", "p0"], CTX); // oldest: dropped, asked again
    expect(fetch).toHaveBeenCalledTimes(1002);
  });

  it("knows the active language's key of a category written in another language", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) => {
        const language = new URL(String(url)).searchParams.get("language");
        const hit = language === "en" ? [{ url_key: "chairs", url_keys: { en: "chairs", pl: "krzesla" } }] : [];
        return Response.json({ results: hit });
      }),
    );
    expect(await localized_catalog_key(["catalog", "chairs"], { ...CTX, language: "pl" })).toBe("krzesla");
    expect(await localized_catalog_key(["catalog", "chairs"], { ...CTX, language: "en" })).toBeNull();
    expect(await localized_catalog_key(["product", "chairs"], { ...CTX, language: "pl" })).toBeNull();
  });
});
