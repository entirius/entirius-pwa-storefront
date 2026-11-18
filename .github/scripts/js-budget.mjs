// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// JS budget of a production build (`pnpm build`, then `node .github/scripts/js-budget.mjs`): gzip size of the JS a page
// loads first. Shared = root chunks + root layout, route = shared + the route's own chunks. Exits 1 over a limit.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const DIST = ".next";
const LIMIT_SHARED_KB = 300;
const LIMIT_ROUTE_KB = 390;

const gzip_size = (file) => gzipSync(readFileSync(join(DIST, file)), { level: 9 }).length;
const total = (files) => [...files].reduce((sum, file) => sum + gzip_size(file), 0);
const kb = (bytes) => Math.round(bytes / 1024);
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const fail = (message) => {
  console.error(`JS budget: ${message}`);
  process.exit(1);
};

const APP_DIR = join(DIST, "server/app");
const manifests = (existsSync(APP_DIR) ? walk(APP_DIR) : []).filter((f) => f.endsWith("page_client-reference-manifest.js"));
if (!manifests.length) fail(`no page manifests in ${APP_DIR}. Run \`pnpm build\` first, from the project root.`);
const { rootMainFiles } = JSON.parse(readFileSync(join(DIST, "build-manifest.json"), "utf8"));

let shared = 0;
const routes = [];
for (const file of manifests) {
  globalThis.__RSC_MANIFEST = {};
  await import(pathToFileURL(file).href);
  const [route, manifest] = Object.entries(globalThis.__RSC_MANIFEST)[0];
  if (!manifest.entryJSFiles) fail(`${file} has no entryJSFiles. Only a Turbopack build writes them: run \`pnpm build\`.`);
  const entries = Object.entries(manifest.entryJSFiles);
  const layout = entries.find(([key]) => key.endsWith("/app/layout"))?.[1];
  if (layout) shared = Math.max(shared, total(new Set([...rootMainFiles, ...layout])));
  routes.push({ route, size: total(new Set([...rootMainFiles, ...entries.flatMap(([, files]) => files)])) });
}
if (!shared) fail("root layout (key ending in /app/layout) not found in the entryJSFiles of any page manifest.");

const largest = routes.reduce((a, b) => (b.size > a.size ? b : a));
console.log(`Shared JS: ${kb(shared)} kB gzip (limit ${LIMIT_SHARED_KB} kB)`);
console.log(`Largest route: ${largest.route} ${kb(largest.size)} kB gzip (limit ${LIMIT_ROUTE_KB} kB)`);

const errors = routes
  .filter(({ size }) => size > LIMIT_ROUTE_KB * 1024)
  .map(({ route, size }) => `Route ${route}: ${kb(size)} kB gzip, limit ${LIMIT_ROUTE_KB} kB`);
if (shared > LIMIT_SHARED_KB * 1024) errors.unshift(`Shared JS (root layout): ${kb(shared)} kB gzip, limit ${LIMIT_SHARED_KB} kB`);
if (errors.length) {
  console.error(`JS budget exceeded (limits in .github/scripts/js-budget.mjs):\n${errors.join("\n")}`);
  process.exit(1);
}
