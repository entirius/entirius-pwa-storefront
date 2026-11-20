// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The release of the theme platform (docs/releasing.md): the four @entirius packages and the two images share one
// version (`v<version>` is its tag).
//
//   node .github/scripts/release.mjs version <tag>   prints version=… and dist_tag=… (for $GITHUB_OUTPUT); fails when the tag
//                                            is not v<version> of every package
//   node .github/scripts/release.mjs pack            the four packages as tarballs in dist/, each with the LICENSE
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGES = ["sdk", "theme-default", "create-theme", "theme-cli"];
const ROOT = fileURLToPath(new URL("../..", import.meta.url));

const version_of = (dir) => JSON.parse(readFileSync(join(ROOT, "packages", dir, "package.json"), "utf8")).version;

// The tag's version, checked against every package; a prerelease (`-alpha.1`) goes out as `next`, a release as
// `latest`.
export function release_version(tag, versions) {
  const match = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag ?? "");
  if (!match) throw new Error(`"${tag}" is not a release tag (v<major>.<minor>.<patch>[-<pre>])`);
  const version = match[1];
  const wrong = Object.entries(versions).filter(([, v]) => v !== version);
  if (wrong.length) {
    throw new Error(`${tag}: the packages are at ${wrong.map(([dir, v]) => `${dir} ${v}`).join(", ")}`);
  }
  return { version, dist_tag: version.includes("-") ? "next" : "latest" };
}

function pack() {
  const dist = join(ROOT, "dist");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist);
  for (const dir of PACKAGES) {
    const folder = join(ROOT, "packages", dir);
    // The MPL text travels with every package; the copy is not kept in the package's folder.
    copyFileSync(join(ROOT, "LICENSE"), join(folder, "LICENSE"));
    try {
      // pnpm turns the workspace:* ranges into the released version.
      execFileSync("pnpm", ["pack", "--pack-destination", dist], { cwd: folder, stdio: "inherit" });
    } finally {
      rmSync(join(folder, "LICENSE"));
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, arg] = process.argv.slice(2);
  try {
    if (command === "version") {
      const { version, dist_tag } = release_version(arg, Object.fromEntries(PACKAGES.map((dir) => [dir, version_of(dir)])));
      console.log(`version=${version}\ndist_tag=${dist_tag}`);
    } else if (command === "pack") {
      pack();
      if (!existsSync(join(ROOT, "dist"))) throw new Error("nothing packed");
    } else {
      console.error("node .github/scripts/release.mjs version <tag> | pack");
      process.exit(1);
    }
  } catch (error) {
    console.error(`release: ${error.message}`);
    process.exit(1);
  }
}
