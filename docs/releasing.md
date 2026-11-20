# Releasing the theme platform

What goes out: the four `@entirius` packages on npm (`storefront-sdk`, `theme-default`, `create-theme`,
`theme-cli`) and the core's two images on ghcr.io (`storefront-dev`, `storefront-builder`). All six share one
version, and the release's tag is `v<version>`. Theme authors and shop builders pick the version by it
([building a theme](themes/guide.md), [building a shop](themes/shop.md)).

The path follows the Handbook's release process (a release commit on `develop`, a pull request to `master`, a tag,
a GitHub release); only what is published differs.

## A release

1. On `develop`, a `chore: release <version>` commit: the `version` of the four `packages/*/package.json`, and the
   changelog's `[Unreleased]` entries under a heading `[<version>] - <date>`. A prerelease is `0.2.0-alpha.1`; it
   goes out under the npm dist-tag `next`, a release under `latest`.
2. A pull request from `develop` to `master`, merged with a merge commit once its checks are green.
3. The tag on that merge commit, then a GitHub release from it (marked as a prerelease for a `-alpha`), with the
   changelog's entry as its description:

   ```bash
   git fetch origin
   git tag -a v<version> -m v<version> origin/master
   git push origin v<version>
   gh release create v<version> --verify-tag --notes-file <the entry> [--prerelease]
   ```

4. The published release starts `.github/workflows/publish.yml`:
   - `version`: the tag must be `v<version>` of every package (`.github/scripts/release.mjs version`), or nothing
     goes out;
   - `npm`: packs the four packages with the repository's `LICENSE` (`release.mjs pack`, pnpm turns `workspace:*`
     into the version) and publishes them through npm's trusted publishing (no token anywhere; the packages carry
     provenance);
   - `images`: both images for `linux/amd64` and `linux/arm64` to `ghcr.io/entirius/storefront-<target>:<version>`,
     never `latest`.

5. Afterwards, from a machine with nothing of the repository: `pnpm create @entirius/theme@<version> check-it`,
   `pnpm install`, `pnpm check`, and `docker pull ghcr.io/entirius/storefront-dev:<version>` without a login.

A published npm version can never be published again, even after an unpublish: a broken release is fixed by the
next version.

## Rehearsing a release

Before a release, the same steps against a local registry (Verdaccio, `docker/verdaccio/compose.yaml`):

```bash
docker/try-themes.sh                         # the registry, both images and the packages at their version
```

or, to try the workflow's own packing and publishing:

```bash
node .github/scripts/release.mjs version v<version>
node .github/scripts/release.mjs pack
printf '//localhost:4873/:_authToken=rehearsal\n' > /tmp/rehearsal.npmrc   # npm wants a token, Verdaccio takes any
for tarball in ./dist/*.tgz; do
  npm publish "$tarball" --access public --tag next --registry http://localhost:4873 --userconfig /tmp/rehearsal.npmrc
done
```

Mind the `./`: npm reads a bare `dist/<name>.tgz` as a GitHub repository and tries to clone it. Then walk
[building a theme](themes/guide.md) from an empty folder with that version.

## Once: the first publication

npm's trusted publishing is set on a package that exists, so each package's first version goes out by hand, from the
account that owns the `entirius` organisation on npm (with its two-factor code):

```bash
node .github/scripts/release.mjs pack
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

In the repository's settings an environment named `npm` (its protection rules, such as a required reviewer, then
guard every publication). Once the workflow has published, the packages' publishing access can require two-factor
authentication and disallow tokens.

ghcr.io: the first run of `images` creates both packages, private. An owner of the GitHub organisation (or an admin
of the repository) makes each public once, in the package's settings; the organisation's settings must allow public
packages. A public package cannot be made private again.
