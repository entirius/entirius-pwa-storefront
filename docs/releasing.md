# Releasing the theme platform

What goes out: the four `@entirius` packages on npm (`storefront-sdk`, `theme-default`, `create-theme`,
`theme-cli`) and the core's three images on ghcr.io (`storefront-dev`, `storefront-builder`, `storefront-runtime`).
All seven share one version, and the release's tag is `v<version>`. Theme authors and shop builders pick the
version by it ([building a theme](themes/guide.md), [building a shop](themes/shop.md)).

Two kinds:

- **A release** (`1.2.3`) is what shops run in production. It follows the Handbook's release process (a release
  commit on `develop`, a pull request to `master`, a tag, a GitHub release); only what is published differs. On npm
  it is `latest`.
- **A pre-release** (`1.2.3-beta.1`, `1.2.3-rc.1`) is a build to try: for a tester, or for a theme author who needs a
  change of the core and tries it on a client's staging before the release. It is a tag on `develop`, with no
  release commit and no pull request to `master`. On npm it is `next`: no `^` range of a theme picks it up, only its
  exact version. The Handbook's versioning page allows pre-release tags on `develop`.

## A release

1. On `develop`, a `chore: release <version>` commit: the `version` of the four `packages/*/package.json`, and the
   changelog's `[Unreleased]` entries under a heading `[<version>] - <date>`.
2. A pull request from `develop` to `master`, merged with a merge commit once its checks are green.
3. The tag on that merge commit, then a GitHub release from it, with the changelog's entry as its description:

   ```bash
   git fetch origin
   git tag -a v<version> -m v<version> origin/master
   git push origin v<version>
   gh release create v<version> --verify-tag --notes-file <the entry>
   ```

4. The published release starts `.github/workflows/publish.yml`:
   - `version` (`.github/scripts/release.mjs version`): a release must be `v<version>` of every package and tagged
     on `master`, a pre-release tagged on `develop` or `master`; the GitHub release's pre-release mark must match
     the tag. Otherwise nothing goes out;
   - `npm`: packs the four packages at the release's version with the repository's `LICENSE` (`release.mjs pack`,
     pnpm turns `workspace:*` into the version) and publishes them through npm's trusted publishing (no token
     anywhere; the packages carry provenance); a version that is on npm already is skipped;
   - `images`: the three images for `linux/amd64` and `linux/arm64` to `ghcr.io/entirius/storefront-<target>:<version>`,
     never `latest`.

5. Afterwards, from a machine with nothing of the repository: `pnpm create @entirius/theme@<version> check-it`,
   `pnpm install`, `pnpm check`, and `docker pull ghcr.io/entirius/storefront-dev:<version>` without a login.

A published npm version can never be published again, even after an unpublish: a broken release is fixed by the
next version.

## A pre-release

A GitHub release marked as a pre-release, from a new tag on `develop`: on GitHub, Releases → Draft a new release →
a new tag `v<version>` on `develop`, "Set as a pre-release", Publish. Or:

```bash
git fetch origin
git tag -a v0.2.0-beta.1 -m v0.2.0-beta.1 origin/develop
git push origin v0.2.0-beta.1
gh release create v0.2.0-beta.1 --verify-tag --prerelease --notes "<what to try>"
```

The version is the tag's: the workflow packs the packages at it, no commit changes `package.json`. Number the
pre-releases of one coming version in order (`-beta.1`, `-beta.2`, then `-rc.1`); each stays on npm for good, so
make one when someone needs to try something, not on every merge.

Whoever tries it sets the exact version, without `^`: the three `@entirius/*` packages of the theme
(`pnpm dev` then runs the dev image of that version), and the two `FROM` lines of a shop's `Dockerfile` on staging.
The shop in production keeps the image it was built from.

## Rehearsing a release

Before a release, the same steps against a local registry (Verdaccio, `docker/verdaccio/compose.yaml`):

```bash
docker/try-themes.sh                         # the registry, the three images and the packages at their version
```

or, to try the workflow's own packing and publishing:

```bash
node .github/scripts/release.mjs pack <version>   # without a version: the packages' own
printf '//localhost:4873/:_authToken=rehearsal\n' > /tmp/rehearsal.npmrc   # npm wants a token, Verdaccio takes any
for tarball in ./dist/*.tgz; do
  npm publish "$tarball" --access public --tag next --registry http://localhost:4873 --userconfig /tmp/rehearsal.npmrc
done
```

Mind the `./`: npm reads a bare `dist/<name>.tgz` as a GitHub repository and tries to clone it. Then walk
[building a theme](themes/guide.md) from an empty folder with that version. (`release.mjs version` checks the
branches of a pushed tag, so it belongs to the workflow.)

## Once: the first publication

A repository without a release has only `develop`. Before the first release pull request (not a pre-release) a
maintainer creates `master` from `develop` as it stands before the release's work
(`git push origin <commit>:refs/heads/master`), so the pull request has the release to show.

npm's trusted publishing is set on a package that exists, so each package's first version goes out by hand, from the
account that owns the `entirius` organisation on npm (with its two-factor code). That happens between the tag and the
GitHub release, from the tagged commit:

```bash
git checkout v<version>
node .github/scripts/release.mjs pack <version>
npm login
for tarball in ./dist/*.tgz; do npm publish "$tarball" --access public --tag next --otp <code>; done
```

The first version of a package is also its `latest`, whatever the dist-tag. Then, for each of the four packages on
npmjs.com, Settings → Trusted publishing → GitHub Actions:

| Field | Value |
|---|---|
| Organization or user | `entirius` |
| Repository | `entirius-pwa-storefront` |
| Workflow filename | `publish.yml` |
| Environment | `npm` |

Then the GitHub release: `npm` skips a version that is on npm already, `images` pushes the images.

In the repository's settings an environment named `npm` (its protection rules, such as a required reviewer, then
guard every publication). Once the workflow has published, the packages' publishing access can require two-factor
authentication and disallow tokens.

ghcr.io: the first run of `images` creates the three packages, private. An owner of the GitHub organisation (or an admin
of the repository) makes each public once, in the package's settings; the organisation's settings must allow public
packages. A public package cannot be made private again.
