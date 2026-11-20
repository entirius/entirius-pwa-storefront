// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { prerenderToNodeStream } from "react-dom/static";
import { CHECKS, render_check } from "./src/lib/check";

// Every check of `entirius check` renders the default theme on the SDK's mocks without an error: the mocks follow
// the contract, and the default theme renders outside the shop.
async function render(element: Parameters<typeof prerenderToNodeStream>[0]) {
  const errors: unknown[] = [];
  const { prelude } = await prerenderToNodeStream(element, { onError: (error) => void errors.push(error) });
  let html = "";
  for await (const chunk of prelude) html += String(chunk);
  return { html, errors };
}

describe("entirius check on the default theme", () => {
  it.each(CHECKS.map((check) => [check.part, check] as const))("%s renders on the mocks", async (_, check) => {
    const { html, errors } = await render(render_check(check));
    expect(errors).toEqual([]);
    // A sheet (the address form) opens in a portal, which the server does not render.
    if (!check.part.startsWith("forms/address-form")) expect(html.length).toBeGreaterThan(0);
  });
});
