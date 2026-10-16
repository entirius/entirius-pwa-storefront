// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { afterEach, describe, expect, it, vi } from "vitest";
import { make_static_access } from "@/API/access/api.static-access";
import { create_api } from "@/API/api.context";
import { localize_category_keys } from "./category-keys";

const CHAIRS = { en: "chairs", pl: "krzesla" };
const SOFAS = { en: "sofas", pl: "sofy" };

// A categories endpoint that, like the real one, finds a key only in the language asked for.
function stub_api() {
  const fetch = vi.fn(async (url: string | URL) => {
    const q = new URL(String(url)).searchParams;
    const language = q.get("language")!;
    const results = [CHAIRS, SOFAS]
      .filter((keys) => q.getAll("url_key").includes(keys[language as "en" | "pl"]))
      .map((keys) => ({ url_key: keys[language as "en" | "pl"], url_keys: keys }));
    return Response.json({ results });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("localize_category_keys", () => {
  afterEach(() => vi.unstubAllGlobals());
  const api = (language: string) => create_api(make_static_access({ channel: "default-europe", language }));

  it("turns another language's keys into the active one's, in the given order", async () => {
    stub_api();
    expect(await localize_category_keys(api("pl"), ["sofas", "chairs"])).toEqual(["sofy", "krzesla"]);
  });

  it("asks once when the keys already are the active language's", async () => {
    const fetch = stub_api();
    expect(await localize_category_keys(api("en"), ["chairs", "sofas"])).toEqual(["chairs", "sofas"]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps a key no language knows", async () => {
    stub_api();
    expect(await localize_category_keys(api("pl"), ["chairs", "nowhere"])).toEqual(["krzesla", "nowhere"]);
  });
});
