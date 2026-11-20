// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The release of the theme platform (docs/releasing.md): the four @entirius packages and the three images share one
// version (`v<version>` is its tag).
//
//   node .github/scripts/release.mjs version <tag> [--prerelease true|false]
//       prints version=… and dist_tag=… (for $GITHUB_OUTPUT), or fails: a release (1.2.3) is the version of every
//       package, tagged on master; a prerelease (1.2.3-beta.1) is tagged on develop or master. --prerelease is how
//       the GitHub release is marked, and must match the tag.
//   node .github/scripts/release.mjs pack [<version>]
//       the four packages as tarballs in dist/, each with the LICENSE; with a version, at that version (a
//       prerelease takes the tag's, its packages are not bumped in a commit)
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGES = ["sdk", "theme-default", "create-theme", "theme-cli"];
const ROOT = fileURLToPath(new URL("../..", import.meta.url));

const version_of = (dir) => JSON.parse(readFileSync(join(ROOT, "packages", dir, "package.json"), "utf8")).version;

// The tag's version. A release (`1.2.3`) is what shops run in production: the packages' own version (the release
// commit sets it), tagged on master, out as `latest`. A prerelease (`1.2.3-beta.1`) is a build to try, for a tester
// or a client's staging: tagged on develop or master, out as `next`, at the tag's version whatever the packages say.
// `branches` hold the tagged commit; `marked_prerelease` is the GitHub release's flag, when known.
export function release_version(tag, versions, { branches = [], marked_prerelease } = {}) {
  const match = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag ?? "");
  if (!match) throw new Error(`"${tag}" is not a release tag (v<major>.<minor>.<patch>[-<pre>])`);
  const version = match[1];
  const prerelease = version.includes("-");
  if (marked_prerelease !== undefined && marked_prerelease !== prerelease) {
    throw new Error(
      prerelease
        ? `${tag} is a prerelease: mark the GitHub release as a pre-release`
        : `${tag} is a release: the GitHub release must not be marked as a pre-release`,
    );
  }
  if (prerelease) {
    if (!branches.some((branch) => branch === "develop" || branch === "master")) {
      throw new Error(`${tag}: a prerelease is tagged on develop or master, not on ${branches.join(", ") || "no branch"}`);
    }
    return { version, dist_tag: "next" };
  }
  const wrong = Object.entries(versions).filter(([, v]) => v !== version);
  if (wrong.length) {
    throw new Error(`${tag}: the packages are at ${wrong.map(([dir, v]) => `${dir} ${v}`).join(", ")}`);
  }
  if (!branches.includes("master")) throw new Error(`${tag}: a release is tagged on master`);
  return { version, dist_tag: "latest" };
}

// The remote branches that hold a commit (the release's checkout has them all).
function branches_of(commit) {
  return execFileSync("git", ["branch", "--remotes", "--contains", commit, "--format=%(refname:lstrip=3)"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line !== "HEAD");
}

function pack(version) {
  const dist = join(ROOT, "dist");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist);
  // Every package at the version before any is packed: pnpm turns the workspace:* ranges into it.
  const manifests = PACKAGES.map((dir) => {
    const path = join(ROOT, "packages", dir, "package.json");
    return { path, text: readFileSync(path, "utf8") };
  });
  try {
    if (version) {
      for (const { path, text } of manifests) writeFileSync(path, `${JSON.stringify({ ...JSON.parse(text), version }, null, 2)}\n`);
    }
    for (const dir of PACKAGES) {
      const folder = join(ROOT, "packages", dir);
      // The MPL text travels with every package; the copy is not kept in the package's folder.
      copyFileSync(join(ROOT, "LICENSE"), join(folder, "LICENSE"));
      try {
        execFileSync("pnpm", ["pack", "--pack-destination", dist], { cwd: folder, stdio: "inherit" });
      } finally {
        rmSync(join(folder, "LICENSE"));
      }
    }
  } finally {
    for (const { path, text } of manifests) writeFileSync(path, text);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, arg, ...rest] = process.argv.slice(2);
  try {
    if (command === "version") {
      const flag = rest[rest.indexOf("--prerelease") + 1];
      const marked_prerelease = rest.includes("--prerelease") ? flag === "true" : undefined;
      const versions = Object.fromEntries(PACKAGES.map((dir) => [dir, version_of(dir)]));
      const { version, dist_tag } = release_version(arg, versions, { branches: branches_of("HEAD"), marked_prerelease });
      console.log(`version=${version}\ndist_tag=${dist_tag}`);
    } else if (command === "pack") {
      pack(arg);
      if (!existsSync(join(ROOT, "dist"))) throw new Error("nothing packed");
    } else {
      console.error("node .github/scripts/release.mjs version <tag> [--prerelease true|false] | pack [<version>]");
      process.exit(1);
    }
  } catch (error) {
    console.error(`release: ${error.message}`);
    process.exit(1);
  }
}
