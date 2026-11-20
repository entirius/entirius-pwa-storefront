#!/usr/bin/env node
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The theme author's command, run in a theme's folder (pnpm create @entirius/theme):
//
//   entirius dev [--port 3100] [--image <ref>]   the shop with this theme, the core in the storefront-dev container;
//       [--backend <url> --channel <code> --key <checkout key>]   the first run asks for them (or takes these)
//   entirius build [--tag <image>] [--config <dir>]   a production image of the shop with this theme
//   entirius list [--all]                        what a theme can override, by where it shows; ✓ = in src/
//   entirius eject <path>                        copies a default file to src/<path>
//   entirius check                               types, the contract's imports, an override's exports, and every
//                                                template rendered with this theme on the SDK's mocks
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const CONFIG = join(ROOT, "_CONFIG.dev");
const DEFAULT_SRC = join(ROOT, "node_modules/@entirius/theme-default/src");
const CATALOGUE = join(ROOT, "node_modules/@entirius/theme-default/overrides.json");
const SDK_PACKAGE = join(ROOT, "node_modules/@entirius/storefront-sdk/package.json");
const IMAGE = "ghcr.io/entirius/storefront-dev";
const BUILDER = "ghcr.io/entirius/storefront-builder";
const LOCAL_BACKEND = "http://localhost:8100";

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
    return /\.(tsx?|css)$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [relative(base, path)] : [];
  });
}
const component = (file) => file.replace(/\.tsx?$/, "");

function installed_sdk() {
  if (!existsSync(DEFAULT_SRC) || !existsSync(SDK_PACKAGE)) fail("No @entirius packages here: run pnpm install first.");
  return JSON.parse(readFileSync(SDK_PACKAGE, "utf8")).version;
}

const read_json = (path) => JSON.parse(readFileSync(path, "utf8"));
const write_json = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);

// The shop configuration for theme work: the core's template from the image, then this backend, channel and key.
async function configure(image, args, user) {
  const copy = spawnSync(
    "docker",
    ["run", "--rm", ...user, "--entrypoint", "sh", "-v", `${ROOT}:/out`, image, "-c", "cp -r /app/_CONFIG.example /out/_CONFIG.dev"],
    { stdio: "inherit" },
  );
  if (copy.status !== 0) fail(`Could not read the configuration template from ${image}.`);

  let backend = option(args, "--backend");
  let channel = option(args, "--channel");
  let key = option(args, "--key");
  if (!backend && !process.stdin.isTTY) {
    console.log(`_CONFIG.dev written from the core's template. Point it at your backend:
  app.config.json        API_BASE_URL (a backend on this machine: http://localhost:<port>)
  channels.config.json   your channel and its API_CHECKOUT_KEY
  countries.config.json  the countries and the channel they use
or run entirius dev --backend <url> --channel <code> --key <checkout key>.`);
    return false;
  }
  if (!backend) {
    const ask = createInterface({ input: process.stdin, output: process.stdout });
    console.log("The shop needs a backend: your staging, your own installation or a local zeno.");
    backend = (await ask.question(`Backend URL [${LOCAL_BACKEND}]: `)).trim() || LOCAL_BACKEND;
    channel = (await ask.question("Channel [default-europe]: ")).trim() || "default-europe";
    key = (await ask.question("Checkout API key of that channel (empty: browsing works, checkout does not): ")).trim();
    ask.close();
  }
  channel ||= "default-europe";

  const app = read_json(join(CONFIG, "app.config.json"));
  write_json(join(CONFIG, "app.config.json"), { ...app, API_BASE_URL: backend.replace(/\/$/, "") });
  write_json(join(CONFIG, "channels.config.json"), { [channel]: { CHANNEL_LABEL: channel, API_CHECKOUT_KEY: key ?? "" } });
  const countries = read_json(join(CONFIG, "countries.config.json"));
  for (const country of Object.values(countries)) {
    if (country && typeof country === "object" && "channels" in country) {
      country.channels = [channel];
      if ("default_channel" in country) country.default_channel = channel;
    }
  }
  write_json(join(CONFIG, "countries.config.json"), countries);
  console.log(`_CONFIG.dev: ${backend}, channel ${channel}. Change it there any time.`);
  return true;
}

async function dev(args) {
  const image = option(args, "--image") ?? `${IMAGE}:${installed_sdk()}`;
  const port = option(args, "--port") ?? "3100";
  // Files the container writes into this folder stay yours (Linux; Docker Desktop maps them anyway).
  const user = process.getuid ? ["--user", `${process.getuid()}:${process.getgid()}`] : [];
  if (!existsSync(CONFIG) && !(await configure(image, args, user))) return 0;
  mkdirSync(SRC, { recursive: true });
  console.log(`The shop with this theme: http://localhost:${port}`);
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

// A production image of the shop: the core's builder of the installed SDK's version, this theme's src/ and a
// configuration (_CONFIG.dev unless --config). The way to a shop's own repository and registry is the Dockerfile
// in the README; this is the short way to see the theme built.
function build(args) {
  const image = option(args, "--builder") ?? `${BUILDER}:${installed_sdk()}`;
  const config = option(args, "--config") ?? CONFIG;
  const tag = option(args, "--tag") ?? `${basename(ROOT).toLowerCase().replace(/[^a-z0-9._-]+/g, "-")}:local`;
  if (!existsSync(join(config, "app.config.json"))) fail(`No configuration in ${config}: run entirius dev first, or pass --config <dir>.`);
  const context = mkdtempSync(join(tmpdir(), "entirius-build-"));
  try {
    cpSync(SRC, join(context, "theme", "src"), { recursive: true });
    if (existsSync(join(ROOT, "theme.json"))) copyFileSync(join(ROOT, "theme.json"), join(context, "theme", "theme.json"));
    cpSync(config, join(context, "_CONFIG"), { recursive: true });
    writeFileSync(
      join(context, "Dockerfile"),
      `FROM ${image}\nCOPY _CONFIG /app/_CONFIG\nCOPY theme /app/theme\nRUN storefront build\n`,
    );
    const run = spawnSync("docker", ["build", "-t", tag, context], { stdio: "inherit" });
    if (run.status !== 0) return run.status ?? 1;
  } finally {
    rmSync(context, { recursive: true, force: true });
  }
  console.log(`
Image ${tag}: this theme and this configuration on the core of ${image}. It holds the configuration's keys: keep it
private. Run it:

  docker run --rm -p 3100:3000 --add-host host.docker.internal:host-gateway ${tag}
`);
  return 0;
}

// The default theme's catalogue (overrides.json) groups its files by where they show, one line each; an older
// default theme without it gets the plain list of paths.
function list(args) {
  installed_sdk();
  const all = args.includes("--all");
  const defaults = files(DEFAULT_SRC).map(component).filter((path) => !path.startsWith("lib/")).sort();
  const own = new Set(files(SRC).map(component));
  const extra = [...own].filter((path) => !defaults.includes(path)).sort();
  if (!existsSync(CATALOGUE)) {
    console.log("Overridden in src/:");
    for (const path of [...own].sort()) console.log(`  ${path}${defaults.includes(path) ? "" : "   (no default: a file of the theme's own)"}`);
    if (!own.size) console.log("  nothing yet");
    console.log("\nFrom @entirius/theme-default (pnpm eject <path> to override):");
    for (const path of defaults.filter((path) => !own.has(path))) console.log(`  ${path}`);
    return 0;
  }
  const { groups } = JSON.parse(readFileSync(CATALOGUE, "utf8"));
  const listed = new Set(groups.flatMap((group) => Object.keys({ ...group.items, ...group.more })));
  // A default file the catalogue does not describe still shows, without a description.
  const rest = defaults.filter((path) => !listed.has(path));
  if (rest.length) groups.push({ title: "Other", items: Object.fromEntries(rest.map((path) => [path, ""])) });
  const width = Math.max(...[...listed, ...rest].map((path) => path.length));
  const line = (path, about) => console.log(`${own.has(path) ? "✓" : " "} ${about ? path.padEnd(width) + "  " + about : path}`);
  console.log("What this theme can override (✓: your copy in src/; pnpm eject <path> makes one)");
  let hidden = 0;
  for (const group of groups) {
    console.log(`\n${group.title}${group.where ? ` (${group.where})` : ""}`);
    const items = Object.entries(group.items);
    const more = Object.entries(group.more ?? {});
    if (group.compact && !all) {
      for (const [path, about] of items.filter(([path]) => own.has(path))) line(path, about);
      const names = items.filter(([path]) => !own.has(path)).map(([path]) => basename(path));
      console.log(`  ${names.slice(0, 4).join(", ")}${names.length > 4 ? ` and ${names.length - 4} more` : ""}: pnpm overrides --all`);
      continue;
    }
    for (const [path, about] of items) line(path, about);
    for (const [path, about] of more) if (all || own.has(path)) line(path, about);
    hidden += all ? 0 : more.filter(([path]) => !own.has(path)).length;
  }
  if (extra.length) {
    console.log("\nYour own files (no default)");
    for (const path of extra) console.log(`✓ ${path}`);
  }
  if (hidden) console.log(`\n${hidden} smaller parts not shown: pnpm overrides --all`);
  return 0;
}

function eject(path) {
  installed_sdk();
  if (!path) fail("Usage: entirius eject <path>   (pnpm overrides shows the paths)");
  const base = component(path);
  const source = [".tsx", ".ts", ""].map((ext) => join(DEFAULT_SRC, base + ext)).find((path) => existsSync(path) && /\.(tsx?|css)$/.test(path));
  if (!source) fail(`@entirius/theme-default has no ${base}: pnpm overrides shows what it has.`);
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

  for (const file of own.filter((file) => /\.tsx?$/.test(file))) {
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

  // Every page template and every part the core draws with props, rendered with this theme on the SDK's mocks.
  if (types) {
    const here = dirname(fileURLToPath(import.meta.url));
    const render = spawnSync(process.execPath, ["--enable-source-maps", "--import", join(here, "check/register.mjs"), join(here, "check/render.mjs")], {
      stdio: "inherit",
      env: { ...process.env, ENTIRIUS_THEME_ROOT: ROOT },
    });
    if (render.status !== 0) problems.push("render: see the parts above that failed on the mocks");
  }

  for (const problem of problems) console.error(problem);
  console.log(problems.length ? `${problems.length} problem(s).` : `OK: ${own.length} file(s) in src/.`);
  return problems.length ? 1 : 0;
}

const [command, ...rest] = process.argv.slice(2);
const commands = { dev: () => dev(rest), build: () => build(rest), list: () => list(rest), eject: () => eject(rest[0]), check };
if (!commands[command]) {
  console.log("entirius dev [--port 3100] [--backend <url> --channel <code> --key <key>] | build [--tag <image>] | list [--all] | eject <path> | check");
  process.exit(command ? 1 : 0);
}
process.exit(await commands[command]());
