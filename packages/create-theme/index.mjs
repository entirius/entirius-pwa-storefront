#!/usr/bin/env node
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// pnpm create @entirius/theme <name> [--example] [--registry <url>]
//
// A new folder with a theme that overrides nothing yet (--example: a theme with a look of its own to start from): the shop looks like the default theme until a file in src/
// takes the place of the default one at the same path (`pnpm eject <path>` copies it there). --registry writes an
// .npmrc that takes @entirius/* from that registry (a private one, or a local stand-in for npm).
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const { version } = JSON.parse(readFileSync(join(here, "package.json"), "utf8"));

const args = process.argv.slice(2);
const registry_at = args.indexOf("--registry");
const registry = registry_at >= 0 ? args[registry_at + 1] : null;
const example = args.includes("--example");
const folder = args.find((arg, i) => !arg.startsWith("--") && i !== registry_at + 1);

if (!folder || (registry_at >= 0 && !registry)) {
  console.error("Usage: pnpm create @entirius/theme <name> [--example] [--registry <url>]");
  process.exit(1);
}
const target = resolve(folder);
if (existsSync(target)) {
  console.error(`${folder} already exists.`);
  process.exit(1);
}

const name = basename(target).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
cpSync(join(here, "template"), target, { recursive: true });
// npm drops .gitignore from published packages: the template ships it without the dot.
renameSync(join(target, "gitignore"), join(target, ".gitignore"));
for (const file of ["package.json", "theme.json", "README.md"]) {
  const path = join(target, file);
  writeFileSync(path, readFileSync(path, "utf8").replaceAll("{{name}}", name).replaceAll("{{version}}", version));
}
mkdirSync(join(target, "src"), { recursive: true });
// The example: its own colours and shapes (tokens.css) and its own product card.
if (example) cpSync(join(here, "example", "src"), join(target, "src"), { recursive: true });
if (registry) writeFileSync(join(target, ".npmrc"), `@entirius:registry=${registry}\n`);

console.log(`Theme "${name}" in ${folder}.

  cd ${folder}
  pnpm install
  pnpm dev       # the shop with this theme on http://localhost:3100 (the first run asks for your backend)
  pnpm overrides # what the default theme has, what you override
  pnpm eject components/product-card
  pnpm check
  pnpm build     # a production image of the shop with this theme
`);
