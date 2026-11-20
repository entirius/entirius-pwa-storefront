// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Runs tests/e2e/theme-override.spec.ts with this test theme installed at theme/ (a symlink), then removes it:
// `pnpm test:e2e:theme`. The dev server it starts must be its own, so a running one on :3100 stops it; the dev
// cache is cleared before and after, so neither run resolves @theme/* from the other.
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, rmSync, symlinkSync } from "node:fs";

const THEME = "theme";

if (existsSync(THEME) && !lstatSync(THEME).isSymbolicLink()) {
  console.error("theme/ holds an installed theme: move it away first.");
  process.exit(1);
}
const running = await fetch("http://localhost:3100", { method: "HEAD" }).then(() => true, () => false);
if (running) {
  console.error("A server answers on :3100: stop it, the run needs a dev server with the test theme.");
  process.exit(1);
}

const clear_dev_cache = () => rmSync(".next/dev", { recursive: true, force: true });
clear_dev_cache();
rmSync(THEME, { force: true });
symlinkSync("tests/theme-example", THEME, "dir");
try {
  const run = spawnSync(
    "pnpm",
    ["exec", "playwright", "test", "tests/e2e/theme-override.spec.ts", ...process.argv.slice(2)],
    { stdio: "inherit", env: { ...process.env, E2E_THEME: "example" } },
  );
  process.exitCode = run.status ?? 1;
} finally {
  rmSync(THEME, { force: true });
  clear_dev_cache();
}
