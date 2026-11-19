// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const core = json("../../package.json");
const template = json("./template/package.json").devDependencies;

// A new theme type-checks against the same React, Next and TypeScript the core builds with, and takes the
// @entirius packages of the generator's own release.
describe("create-theme template", () => {
  it.each(["next", "react", "react-dom", "react-hook-form"])("pins %s like the core", (name) => {
    expect(template[name]).toBe(core.dependencies[name]);
  });

  it.each(["@types/react", "@types/react-dom", "typescript"])("pins %s like the core", (name) => {
    expect(template[name]).toBe(core.devDependencies[name]);
  });

  it.each(["@entirius/storefront-sdk", "@entirius/theme-default", "@entirius/theme-cli"])(
    "takes %s of the generator's release",
    (name) => {
      expect(template[name]).toBe("^{{version}}");
    },
  );

  it("releases with the SDK, the default theme and the CLI", () => {
    const version = json("./package.json").version;
    for (const name of ["sdk", "theme-default", "theme-cli"]) {
      expect(json(`../${name}/package.json`).version).toBe(version);
    }
  });
});
