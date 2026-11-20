// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { release_version } from "./release.mjs";

const all = (version: string) => ({ sdk: version, "theme-default": version, "create-theme": version, "theme-cli": version });

describe("release_version", () => {
  it("takes a release from master at the packages' version, out as latest", () => {
    expect(release_version("v1.2.3", all("1.2.3"), { branches: ["develop", "master"] })).toEqual({ version: "1.2.3", dist_tag: "latest" });
  });

  it("takes a prerelease from develop or master at the tag's version, out as next", () => {
    expect(release_version("v0.2.0-beta.3", all("0.1.0-alpha.9"), { branches: ["develop"] })).toEqual({
      version: "0.2.0-beta.3",
      dist_tag: "next",
    });
    expect(release_version("v0.1.0-alpha.9", all("0.1.0-alpha.9"), { branches: ["master"] }).dist_tag).toBe("next");
  });

  it("refuses a tag that is not a version", () => {
    expect(() => release_version("0.1.0", all("0.1.0"), { branches: ["master"] })).toThrow(/not a release tag/);
    expect(() => release_version("shop-0.1.0", all("0.1.0"), { branches: ["master"] })).toThrow(/not a release tag/);
  });

  it("refuses a release off master, or at another version than the packages", () => {
    expect(() => release_version("v1.2.3", all("1.2.3"), { branches: ["develop"] })).toThrow(/tagged on master/);
    expect(() => release_version("v0.1.0", { ...all("0.1.0"), "theme-cli": "0.0.9" }, { branches: ["master"] })).toThrow(
      /theme-cli 0.0.9/,
    );
  });

  it("refuses a prerelease tagged on another branch", () => {
    expect(() => release_version("v0.2.0-rc.1", all("0.1.0"), { branches: ["feature/x"] })).toThrow(/develop or master, not on feature\/x/);
    expect(() => release_version("v0.2.0-rc.1", all("0.1.0"))).toThrow(/not on no branch/);
  });

  it("refuses a GitHub release marked the other way than its tag", () => {
    expect(() => release_version("v0.2.0-rc.1", all("0.1.0"), { branches: ["develop"], marked_prerelease: false })).toThrow(
      /mark the GitHub release as a pre-release/,
    );
    expect(() => release_version("v1.2.3", all("1.2.3"), { branches: ["master"], marked_prerelease: true })).toThrow(
      /must not be marked/,
    );
  });
});
