// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { sanitize_html } from "./sanitize-html";

describe("sanitize_html", () => {
  it("opens http(s) links in a new tab and replaces target and rel", () => {
    expect(
      sanitize_html('<a href="https://x.test" target="_self" rel="nofollow">x</a>', { new_tab_links: true }),
    ).toBe('<a href="https://x.test" rel="noopener" target="_blank">x</a>');
  });

  it("leaves internal links alone", () => {
    expect(sanitize_html('<a href="/catalog/a">x</a>', { new_tab_links: true })).toBe('<a href="/catalog/a">x</a>');
  });

  it("keeps markup hidden in a quoted attribute inert", () => {
    // The `<img>` stays text inside `title`; the new-tab attributes land on the real tag.
    expect(
      sanitize_html('<a href="https://x.test" title="><img src=x onerror=alert(1)>">t</a>', { new_tab_links: true }),
    ).toBe('<a href="https://x.test" title="><img src=x onerror=alert(1)>" target="_blank" rel="noopener">t</a>');
  });

  it("removes the hook after the call", () => {
    sanitize_html('<a href="https://x.test">x</a>', { new_tab_links: true });
    expect(sanitize_html('<a href="https://x.test">x</a>')).toBe('<a href="https://x.test">x</a>');
  });
});
