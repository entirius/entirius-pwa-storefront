// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("bin/entirius.mjs", import.meta.url));
// An empty folder: a command that ran instead of printing its usage would fail here, not build or write anything.
const folder = mkdtempSync(join(tmpdir(), "entirius-help-"));
const run = (...args: string[]) => spawnSync("node", [cli, ...args], { cwd: folder, encoding: "utf8" });

afterAll(() => rmSync(folder, { recursive: true, force: true }));

describe("entirius --help", () => {
  it("prints the usage of every command and runs none of them", () => {
    for (const args of [["--help"], ["-h"], ["build", "--help"], ["dev", "--help"], ["eject", "-h"], ["check", "--help"]]) {
      const out = run(...args);
      expect(out.status, args.join(" ")).toBe(0);
      expect(out.stdout).toContain("entirius build [--tag <image>] [--config <folder with the shop's app.config.json>]");
      expect(out.stdout).toContain("entirius dev [--port 3100]");
    }
  });

  it("prints the usage without a command, and fails on an unknown one", () => {
    expect(run().status).toBe(0);
    const unknown = run("publish");
    expect(unknown.status).toBe(1);
    expect(unknown.stdout).toContain("entirius check");
  });
});
