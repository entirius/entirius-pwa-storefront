// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const packages = fileURLToPath(new URL("..", import.meta.url));
const cli = join(packages, "theme-cli/bin/entirius.mjs");
const folders: string[] = [];

// A theme folder with the SDK installed, a default theme (this repo's, or the one given) and the files of `own`.
function theme(own: string[], default_theme = join(packages, "theme-default")) {
  const root = mkdtempSync(join(tmpdir(), "entirius-list-"));
  folders.push(root);
  mkdirSync(join(root, "node_modules/@entirius"), { recursive: true });
  symlinkSync(join(packages, "sdk"), join(root, "node_modules/@entirius/storefront-sdk"));
  symlinkSync(default_theme, join(root, "node_modules/@entirius/theme-default"));
  for (const path of own) {
    mkdirSync(join(root, "src", path, ".."), { recursive: true });
    writeFileSync(join(root, "src", path), "");
  }
  return root;
}
const list = (root: string, ...args: string[]) =>
  spawnSync("node", [cli, "list", ...args], { cwd: root, encoding: "utf8" }).stdout;

afterEach(() => {
  for (const root of folders.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("entirius list", () => {
  it("groups by where a part shows, ticks the theme's copies and folds the UI elements", () => {
    const out = list(theme(["tokens.css", "components/product-card.tsx"]));
    expect(out).toContain("\nProduct card (catalogue, search, similar products, CMS tiles)\n");
    expect(out).toMatch(/^✓ tokens\.css +palette/m);
    expect(out).toMatch(/^✓ components\/product-card +the card/m);
    expect(out).toMatch(/^ {2}components\/product-price +price/m);
    expect(out).toMatch(/^ {2}button, input, select, sheet and \d+ more: pnpm overrides --all$/m);
    expect(out).not.toContain("ui/button");
    expect(out).not.toContain("product/gallery-utils");
    expect(out).toMatch(/^\d+ smaller parts not shown: pnpm overrides --all$/m);
  });

  it("shows everything with --all, an overridden smaller part without it, and the theme's own files", () => {
    const root = theme(["layout/count-badge.tsx", "components/promo-strip.tsx"]);
    expect(list(root, "--all")).toMatch(/^ {2}ui\/button +buttons/m);
    expect(list(root, "--all")).toMatch(/^ {2}product\/gallery-utils +gallery helpers/m);
    const out = list(root);
    expect(out).toMatch(/^✓ layout\/count-badge +number on/m);
    expect(out).toContain("\nYour own files (no default)\n✓ components/promo-strip\n");
  });

  it("falls back to the plain list with a default theme that has no catalogue", () => {
    const old = mkdtempSync(join(tmpdir(), "entirius-old-default-"));
    folders.push(old);
    mkdirSync(join(old, "src/ui"), { recursive: true });
    writeFileSync(join(old, "src/ui/button.tsx"), "");
    const out = list(theme([], old));
    expect(out).toContain("From @entirius/theme-default (pnpm eject <path> to override):\n  ui/button\n");
  });
});
