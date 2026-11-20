// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Renders every check of the default theme (`@theme/lib/check`: the page templates and the parts the core draws
// with props, on the SDK's mocks) with this theme's files in place, and names the ones that fail. Run by
// `entirius check` through register.mjs.
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.env.ENTIRIUS_THEME_ROOT;
const from_theme = (specifier) => import(pathToFileURL(createRequire(join(ROOT, "package.json")).resolve(specifier)).href);

const { prerenderToNodeStream } = await from_theme("react-dom/static");
// The checks import every template: a file that does not load (a missing export, a bad import) stops them all.
const { CHECKS, render_check } = await import("@theme/lib/check").catch((error) => {
  console.error(`render: the theme does not load: ${error?.message ?? error}`);
  process.exit(1);
});

// The first frame of the stack in the theme's own files, else the first one at all.
function where(error) {
  const frames = String(error?.stack ?? "").split("\n").slice(1);
  const own = frames.find((frame) => frame.includes(join(ROOT, "src"))) ?? frames[0] ?? "";
  return own.trim().replace(/file:\/\//, "").replace(`${ROOT}/`, "");
}

let failed = 0;
for (const check of CHECKS) {
  const errors = [];
  try {
    const { prelude } = await prerenderToNodeStream(render_check(check), { onError: (error) => void errors.push(error) });
    for await (const chunk of prelude) void chunk;
  } catch (error) {
    errors.push(error);
  }
  if (!errors.length) continue;
  failed += 1;
  // React reports an error again when it retries the part; once is enough.
  const lines = new Set(errors.map((error) => `render ${check.part}: ${error?.message ?? error}\n  ${where(error)}`));
  for (const line of lines) console.error(line);
}
console.log(`Rendered ${CHECKS.length - failed} of ${CHECKS.length} on the mocks${relative(process.cwd(), ROOT) ? ` (${ROOT})` : ""}.`);
process.exit(failed ? 1 : 0);
