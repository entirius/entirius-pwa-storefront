// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { profile_path } from "./profile-path";

describe("profile_path", () => {
  it("prefixes a country profile, never `default`", () => {
    expect(profile_path("pl", "/catalog/x")).toBe("/pl/catalog/x");
    expect(profile_path("default", "/catalog/x")).toBe("/catalog/x");
    expect(profile_path(undefined, "/catalog/x")).toBe("/catalog/x");
  });
});
