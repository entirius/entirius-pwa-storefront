// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { release_version } from "./release.mjs";

const all = (version: string) => ({ sdk: version, "theme-default": version, "create-theme": version, "theme-cli": version });

describe("release_version", () => {
  it("takes the version from the tag: a prerelease as next, a release as latest", () => {
    expect(release_version("v0.1.0-alpha.8", all("0.1.0-alpha.8"))).toEqual({ version: "0.1.0-alpha.8", dist_tag: "next" });
    expect(release_version("v1.2.3", all("1.2.3"))).toEqual({ version: "1.2.3", dist_tag: "latest" });
  });

  it("refuses a tag that is not a version, and packages at another version", () => {
    expect(() => release_version("0.1.0", all("0.1.0"))).toThrow(/not a release tag/);
    expect(() => release_version("llum-0.1.0", all("0.1.0"))).toThrow(/not a release tag/);
    expect(() => release_version("v0.1.0", { ...all("0.1.0"), "theme-cli": "0.0.9" })).toThrow(/theme-cli 0.0.9/);
  });
});
