# Building and running a shop

A shop is **one version of the core, one version of a theme and one configuration**, built into one Docker image.
Its manifest is its `Dockerfile`: a few lines name all three. There is no other file to keep in step.

Before you start: a theme package in a registry ([the theme guide](guide.md)), Docker, and the shop's backend
(an Entirius platform instance with the shop's channel). To try a shop before the theme is in a registry, build it
from the theme's folder instead: `pnpm build --config <the shop's _CONFIG> --tag my-shop:1`
([the theme guide](guide.md#6-release-the-theme)).

## 1. The configuration

The core's template configuration comes out of the builder image:

```bash
mkdir my-shop && cd my-shop
docker run --rm --user "$(id -u):$(id -g)" --entrypoint sh -v "$PWD":/out \
  ghcr.io/entirius/storefront-builder:<version> -c 'cp -r /app/_CONFIG.example /out/_CONFIG'
```

In `_CONFIG` ([every setting](../configuration.md)), at least:

| File | What to set |
|---|---|
| `app.config.json` | `API_BASE_URL`: the backend's public address. The browser calls it directly and the shop's server too, so it must be reachable from both (and allow the shop's address, CORS). `SITE_URL`: the shop's own public address (canonical links, the sitemap). `SITE_NAME`. **`DEBUG_MODE: false`** for a shop people use (the template and `_CONFIG.dev` have it on: developer tools and logs). `MENU_CINFGURATION.CONFIG_QUERY.url_key`: the categories of the menu's top level (the template names `chairs` and `sofas` of the demo data). |
| `channels.config.json` | One entry per channel the shop sells in, under the channel's code (the key, e.g. `"default-europe"`: the code of the channel in the backend): `CHANNEL_LABEL` (a name), `API_CHECKOUT_KEY`, and the optional keys that switch on contact forms, the newsletter, agreements and back-in-stock alerts. Delete the template's placeholder entry and the channels you do not sell in. |
| `countries.config.json` | The countries the shop serves, each a key (`"pl"`; `"default"` serves every other visitor): `languages` and `default_language` (one of them), `currencies` and `default_currency`, `channels` and `default_channel` (codes from `channels.config.json`). Keep `default` (adapt it) and replace the template's example `uk` with the shop's countries. |
| `brand/` | The logo, favicon and share image. |
| `messages.config.json` | Optional: the shop's own wording of any interface text, by message key (the keys and the default texts: `node_modules/@entirius/storefront-sdk/src/i18n/messages/en.ts` in a theme). |
| `theme.css` | Optional: the shop's own colour or shape on top of the theme (it loads after the theme's `tokens.css`). |
| `fonts.ts` | The typefaces (`next/font`), built into the shop. |

`_CONFIG.dev` of the theme you worked on is the same format: a shop can start from it. [Every setting](../configuration.md)
is described in the core's configuration guide, written for its repository: the keys and their meaning are the same.

## 2. The `Dockerfile`

```dockerfile
# My shop: the storefront core of one version, my theme of one version, my configuration.
FROM ghcr.io/entirius/storefront-builder:0.1.0 AS build
COPY _CONFIG /app/_CONFIG
RUN storefront build @acme/theme-my-theme@1.3.0

FROM ghcr.io/entirius/storefront-runtime:0.1.0
COPY --from=build /app/out /app
```

- The two `FROM` lines name the core's version, the same in both: the version of the theme's `@entirius/*`
  packages itself, without the `^` of `package.json` (`pnpm list @entirius/storefront-sdk` in the theme shows it).
- `storefront build <package>@<version>` installs the theme from its registry and builds the shop. The build needs
  no backend. The result, `/app/out`, is all the shop needs to run: the server, its static files and the
  configuration.
- The shop's image is the small `storefront-runtime` (Node and the `storefront` command) with that copied in: about
  450 MB, without the build tools.
- A theme in a **private registry** needs an `.npmrc` with that registry and its token during the build only. Keep
  one just for the build, `build.npmrc`, with the theme's scope alone, and out of version control (it holds the
  token):

  ```ini
  @acme:registry=https://npm.example.com/
  //npm.example.com/:_authToken=<token>
  ```

  A registry on your own machine is `@acme:registry=http://host.docker.internal:4873/` from inside the build (no
  token line when it has no login). The build takes the file as a secret, so the token stays out of the image:

  ```dockerfile
  FROM ghcr.io/entirius/storefront-builder:0.1.0 AS build
  COPY _CONFIG /app/_CONFIG
  RUN --mount=type=secret,id=npmrc,target=/root/.npmrc storefront build @acme/theme-my-theme@1.3.0

  FROM ghcr.io/entirius/storefront-runtime:0.1.0
  COPY --from=build /app/out /app
  ```

  ```bash
  docker build --secret id=npmrc,src=build.npmrc -t my-shop:1 .
  ```

  On Linux a registry on your machine also needs `--add-host host.docker.internal:host-gateway` on `docker build`.

## 3. Build and run

```bash
docker build -t my-shop:1 .                                    # a theme from npm
docker build --secret id=npmrc,src=build.npmrc -t my-shop:1 .  # a theme from a private registry
docker run -d --name my-shop -p 80:3000 my-shop:1
```

The shop listens on port 3000 inside the container. Put a TLS-terminating reverse proxy (or your platform's load
balancer) in front of it, at the address of `SITE_URL`.

A backend on `localhost` (trying a shop next to a local platform) is reached through the same address from the
browser and the container: the image passes that port on to the host. On Linux add
`--add-host host.docker.internal:host-gateway` (elsewhere it does no harm: `pnpm build` prints it for every system).

## 4. A new version, and back

Every change (a new theme version, a new core version, a changed configuration) is a new image with a new tag:

```bash
# Dockerfile: RUN ... storefront build @acme/theme-my-theme@1.4.0
docker build --secret id=npmrc,src=build.npmrc -t my-shop:2 .   # without --secret for a theme from npm
docker stop my-shop && docker rm my-shop
docker run -d --name my-shop -p 80:3000 my-shop:2
```

Going back is running the previous tag: `my-shop:1` is still the shop it was. Keep the `Dockerfile` and `_CONFIG` in
version control and tag them with the image's tag: then you know what each image holds, and can build it again.

**The shop's image holds its `_CONFIG`, with its API keys.** Push it only to a private registry, never a public one.

## 5. Deploying: examples

How a shop gets to its server is up to whoever runs it; two common shapes:

**GitHub Actions, to a private registry** (the server then pulls and runs the tag):

```yaml
on:
  push:
    tags: ["v*"]
jobs:
  image:
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v7
      - uses: docker/login-action@v4
        with: { registry: ghcr.io, username: "${{ github.actor }}", password: "${{ secrets.GITHUB_TOKEN }}" }
      - uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: ghcr.io/acme/my-shop:${{ github.ref_name }}
          secrets: |
            npmrc=${{ secrets.THEME_NPMRC }}
```

The `_CONFIG` with its keys then has to be in the repository, or written into the build from the CI's secrets.

**GitLab CI with a shell runner on the shop's server** (builds and runs in place):

```yaml
deploy:
  tags: [shop-server]
  only: [tags]
  script:
    - docker build --secret id=npmrc,src=$THEME_NPMRC -t my-shop:$CI_COMMIT_TAG .
    - docker rm -f my-shop || true
    - docker run -d --name my-shop --restart unless-stopped -p 3000:3000 my-shop:$CI_COMMIT_TAG
```

## When something does not work

| What you see | Why, and what to do |
|---|---|
| `storefront build` cannot fetch the theme | The registry of the theme's scope, or its token: `build.npmrc`, passed with `--secret id=npmrc,src=build.npmrc` to a `Dockerfile` that mounts it. |
| The shop starts, pages show no products | `API_BASE_URL`, the channel or its key; the backend does not accept the shop's address (CORS); the backend is not reachable from the container. |
| Links and the sitemap point at the wrong host | `SITE_URL` in `app.config.json`. |
