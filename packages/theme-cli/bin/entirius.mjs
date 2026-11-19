#!/usr/bin/env node
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The theme author's command, run in a theme's folder (pnpm create @entirius/theme):
//
//   entirius dev [--port 3100] [--image <ref>]   the shop with this theme, the core in the storefront-dev container
//   entirius list                                the default theme's files, and the ones src/ overrides
//   entirius eject <path>                        copies a default file to src/<path>
//   entirius check                               types, the contract's imports, an override's exports
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const CONFIG = join(ROOT, "_CONFIG.dev");
const DEFAULT_SRC = join(ROOT, "node_modules/@entirius/theme-default/src");
const SDK_PACKAGE = join(ROOT, "node_modules/@entirius/storefront-sdk/package.json");
const IMAGE = "ghcr.io/entirius/storefront-dev";

// Imports a theme may use: the SDK, the default theme, other theme files, React and Next, and the default theme's
// own dependencies (the core installs them). Anything else is not in the container that runs the theme.
const CONTRACT = [
  /^@entirius\/storefront-sdk(\/|$)/,
  /^@entirius\/theme-default(\/|$)/,
  /^@theme\//,
  /^react(-dom)?(\/|$)/,
  /^next\//,
  /^(lucide-react|radix-ui|class-variance-authority|clsx|tailwind-merge|embla-carousel-react)$/,
  /^\.\.?\//,
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};
const option = (args, name) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
};

function files(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path, base);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [relative(base, path)] : [];
  });
}
const component = (file) => file.replace(/\.tsx?$/, "");

function installed_sdk() {
  if (!existsSync(DEFAULT_SRC) || !existsSync(SDK_PACKAGE)) fail("No @entirius packages here: run pnpm install first.");
  return JSON.parse(readFileSync(SDK_PACKAGE, "utf8")).version;
}

function dev(args) {
  const image = option(args, "--image") ?? `${IMAGE}:${installed_sdk()}`;
  const port = option(args, "--port") ?? "3100";
  // Files the container writes into this folder stay yours (Linux; Docker Desktop maps them anyway).
  const user = process.getuid ? ["--user", `${process.getuid()}:${process.getgid()}`] : [];
  if (!existsSync(CONFIG)) {
    const copy = spawnSync(
      "docker",
      ["run", "--rm", ...user, "--entrypoint", "sh", "-v", `${ROOT}:/out`, image, "-c", "cp -r /app/_CONFIG.example /out/_CONFIG.dev"],
      { stdio: "inherit" },
    );
    if (copy.status !== 0) fail(`Could not read the configuration template from ${image}.`);
    console.log(`_CONFIG.dev written from the core's template. Point it at your backend:
  app.config.json        API_BASE_URL (a backend on this machine: http://localhost:<port>)
  channels.config.json   your channel and its API_CHECKOUT_KEY
  countries.config.json  the countries and the channel they use
then run it again.`);
    return 0;
  }
  mkdirSync(SRC, { recursive: true });
  // Only src/ goes in: the theme's node_modules would bring a second React and SDK next to the core's.
  const run = spawnSync(
    "docker",
    [
      "run", "--rm", ...(process.stdin.isTTY ? ["-it"] : []),
      "--name", `entirius-dev-${basename(ROOT)}`,
      "-p", `${port}:3100`,
      "--add-host", "host.docker.internal:host-gateway",
      "-v", `${SRC}:/app/theme/src`,
      "-v", `${CONFIG}:/app/_CONFIG`,
      image,
    ],
    { stdio: "inherit" },
  );
  return run.status ?? 1;
}

function list() {
  installed_sdk();
  const defaults = files(DEFAULT_SRC).map(component).filter((path) => !path.startsWith("lib/")).sort();
  const own = new Set(files(SRC).map(component));
  console.log("Overridden in src/:");
  for (const path of [...own].sort()) console.log(`  ${path}${defaults.includes(path) ? "" : "   (no default: a file of the theme's own)"}`);
  if (!own.size) console.log("  nothing yet");
  console.log("\nFrom @entirius/theme-default (pnpm eject <path> to override):");
  for (const path of defaults.filter((path) => !own.has(path))) console.log(`  ${path}`);
  return 0;
}

function eject(path) {
  installed_sdk();
  if (!path) fail("Usage: entirius eject <path>   (entirius list shows the paths)");
  const base = component(path);
  const source = [".tsx", ".ts"].map((ext) => join(DEFAULT_SRC, base + ext)).find(existsSync);
  if (!source) fail(`@entirius/theme-default has no ${base}: entirius list shows what it has.`);
  const target = join(SRC, relative(DEFAULT_SRC, source));
  if (existsSync(target)) fail(`src/${relative(SRC, target)} exists already.`);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  console.log(`src/${relative(SRC, target)}: your copy, used everywhere in place of the default. It no longer gets the default
theme's fixes; pnpm check keeps it in line with the SDK.`);
  return 0;
}

function exported_names(source) {
  const names = new Set();
  for (const m of source.matchAll(/export\s+(?:declare\s+)?(?:async\s+)?(?:function|const|let|class|interface|type|enum)\s+(\w+)/g)) names.add(m[1]);
  for (const m of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.replace(/^type\s+/, "").trim();
      if (name) names.add(name);
    }
  }
  return names;
}

function check() {
  installed_sdk();
  const problems = [];
  const own = files(SRC);

  for (const file of own) {
    const source = readFileSync(join(SRC, file), "utf8");
    for (const m of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g)) {
      if (!CONTRACT.some((allowed) => allowed.test(m[1]))) {
        problems.push(`src/${file}: "${m[1]}" is outside the theme's contract (the SDK, @theme/*, React, Next)`);
      }
    }
    const replaced = join(DEFAULT_SRC, file);
    if (existsSync(replaced)) {
      const theirs = exported_names(source);
      const missing = [...exported_names(readFileSync(replaced, "utf8"))].filter((name) => !theirs.has(name));
      if (missing.length) problems.push(`src/${file}: the default file exports ${missing.join(", ")}, this one does not`);
    }
  }

  const tsc = join(ROOT, "node_modules/.bin/tsc");
  const types = existsSync(tsc) ? spawnSync(tsc, ["--noEmit", "-p", ROOT], { stdio: "inherit" }) : null;
  if (!types) problems.push("TypeScript is not installed: pnpm install");
  else if (types.status !== 0) problems.push("types: see the TypeScript errors above");

  for (const problem of problems) console.error(problem);
  console.log(problems.length ? `${problems.length} problem(s).` : `OK: ${own.length} file(s) in src/.`);
  return problems.length ? 1 : 0;
}

const [command, ...rest] = process.argv.slice(2);
const commands = { dev: () => dev(rest), list, eject: () => eject(rest[0]), check };
if (!commands[command]) {
  console.log("entirius dev [--port 3100] [--image <ref>] | list | eject <path> | check");
  process.exit(command ? 1 : 0);
}
process.exit(commands[command]());
