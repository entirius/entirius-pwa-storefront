// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

// `pnpm create @entirius/theme <name> [--example] [--registry <url>]`: the folder is the first plain argument,
// wherever the flags are (pnpm 12 and 10 pass the name as the first argument, with `--` in front or without).
const generator = fileURLToPath(new URL("./index.mjs", import.meta.url));
let dir = "";

const create = (...args: string[]) => {
  dir = mkdtempSync(join(tmpdir(), "create-theme-"));
  return spawnSync(process.execPath, [generator, ...args], { cwd: dir, encoding: "utf8" });
};

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("create-theme arguments", () => {
  it.each([
    [["my-theme"]],
    [["--", "my-theme"]],
    [["my-theme", "--example"]],
    [["--example", "my-theme"]],
    [["my-theme", "--registry", "http://localhost:4873/"]],
    [["--registry", "http://localhost:4873/", "my-theme"]],
  ])("creates the folder from %j", (args) => {
    const run = create(...args);
    expect(run.status, run.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(dir, "my-theme", "package.json"), "utf8")).name).toBe("my-theme");
  });

  it("writes the registry into the theme's .npmrc", () => {
    create("my-theme", "--registry", "http://localhost:4873/");
    expect(readFileSync(join(dir, "my-theme", ".npmrc"), "utf8")).toContain("@entirius:registry=http://localhost:4873/");
  });

  it("asks for a name without one, and for a registry after --registry", () => {
    expect(create().status).toBe(1);
    expect(create("--registry").status).toBe(1);
    expect(existsSync(join(dir, "--registry"))).toBe(false);
  });
});
