# Building a theme

A theme is a folder of files that replace the look of the Entirius storefront. The storefront itself (pages, data,
cart, checkout, search engines, security) is the **core**: it runs in a Docker container, and you never clone it or
copy it. Your theme overrides files of the **default theme** by their path; everything you do not override stays the
default one, and keeps getting its fixes.

This guide goes from an empty folder to a theme package you can build a shop from. Building and running the shop
itself is [the shop guide](shop.md); what each part of a theme receives is [the contract](contract.md).

## What you need

- **Node.js 22** or newer, **pnpm 10** or newer, **Docker** (Docker Desktop on macOS and Windows).
- **A backend**: an Entirius platform instance with a sales channel. The storefront has no database of its own, so
  whoever builds a shop has one already. Any of these works:
  - the staging instance of the shop you are building the theme for;
  - your own installation of the platform;
  - a local platform with its demo data.
- **Three values from that backend**, which the first run asks for:
  - its address, e.g. `https://api.example.com`, or `http://localhost:8100` for a local one;
  - the channel's code, e.g. `default-europe`;
  - the channel's checkout API key, from the backend's admin (the checkout module's API keys). Without it browsing
    works, the cart and checkout do not.

The browser calls the backend directly, so the backend has to accept requests from the shop's address (CORS): from
`http://localhost:3100` while you work on the theme. A local platform does; for a staging or production instance ask
whoever runs it to allow your addresses. A backend on `localhost` is fine too: the container passes that port on to
your machine, so the browser and the shop's server reach it at the same address.

## 1. Create the theme

```bash
pnpm create @entirius/theme my-theme      # --example: a theme with a look of its own to start from
cd my-theme
pnpm install
```

On the day of a platform release pnpm may still run the previous generator (it waits a day before it takes a new
package, and caches the generator): name the version, `pnpm create @entirius/theme@<version> my-theme` (for example
`@0.1.0-alpha.9`).

The `@entirius` packages from a registry other than npm (a mirror, a company proxy): the generator itself comes
through the `.npmrc` of the folder you run `pnpm create` in, and `--registry` writes the same line into the new
theme's own `.npmrc` (pnpm reads a project's own `.npmrc`, not those of the folders above it):

```bash
printf '@entirius:registry=https://npm.example.com/\n' > .npmrc
pnpm create @entirius/theme my-theme --registry https://npm.example.com/
```

What you get:

| File | What it is |
|---|---|
| `src/` | Your files. Empty at first: the shop looks like the default theme. |
| `README.md` | The commands of this guide, short. |
| `.gitignore` | Keeps `node_modules` and `_CONFIG.dev` (it holds your checkout key) out of version control. |
| `.npmrc` | Only with `--registry`: where the `@entirius` packages come from. |
| `package.json` | The theme package: the SDK (`@entirius/storefront-sdk`), the default theme and the `entirius` command, all of one version. |
| `tsconfig.json` | Resolves `@theme/*` the way the core does: `src/` first, then the default theme. |
| `theme.json` | The theme's name and the SDK version it is written for. |
| `pnpm-workspace.yaml` | Lets a fresh platform release install at once (pnpm otherwise waits a day for a new package), and puts the default theme's libraries in reach of your files (`lucide-react`, `clsx`...). |

## 2. Run the shop with your theme

```bash
pnpm dev
```

The first run asks for the backend's address, the channel and its checkout key, writes them to `_CONFIG.dev` and
starts the shop on http://localhost:3100. The core runs in the `storefront-dev` container of your SDK's version; your
`src/` is mounted into it, so saving a file shows on the next page load, no restart. `pnpm dev` stays in the
foreground: Ctrl+C stops the shop and removes the container.

Without a terminal (a script, a CI job, an editor's task) nobody can answer the questions: pass
`--backend <url> --channel <code> --key <key>`. A key passed that way stays in your shell's history and shows in the
process list while the shop runs; the questions keep it out of both. The answers are written once: `_CONFIG.dev` exists from then on and `pnpm dev` starts straight
away, so to point the theme at another backend edit `_CONFIG.dev` (or delete it and answer again). `_CONFIG.dev` is a whole shop configuration: change it any time (languages,
countries, brand, see [configuration](../configuration.md)).

## 3. Change the look

**Colours and shapes**: the theme's `src/tokens.css` sets the variables of the core's stylesheet. A new theme has
none: `pnpm eject tokens.css` starts one (`--example` themes have it already). It loads after the core's styles, so
a variable set here wins everywhere:

```css
:root {
  --primary: #c2410c;          /* buttons, links, the active state */
  --primary-foreground: #fff;  /* text on --primary */
  --control-radius: 0;         /* square buttons and fields */
  --product-image-ratio: 3 / 4;
}
```

Many themes need little else. Every variable, with what it colours or shapes: [the contract](contract.md#theme-variables).
Typefaces are not the theme's: a shop sets them in its configuration (`fonts.ts`, [the shop guide](shop.md)).

**A component**: list what you can override, by where it shows in the shop, then copy the one you want into `src/`:

```bash
pnpm overrides                 # the main parts; --all adds the smaller ones and the UI elements
pnpm eject product/gallery     # copies the default file to src/product/gallery.tsx
```

Edit the copy. The rules that keep a theme working with the core:

- **Same path, same exports.** The core imports `@theme/product/gallery` and expects its `ProductGallery`. Your file
  replaces the default one only at the same path, and must export what the default file exports.
- **Imports from the contract only**: `@entirius/storefront-sdk`, other theme files through `@theme/...`, React, Next,
  and the libraries the default theme uses (`lucide-react`, `radix-ui`, `class-variance-authority`, `clsx`,
  `tailwind-merge`, `embla-carousel-react`). Nothing else exists in the container that runs the theme.
- **Eject only what you change.** A copy no longer gets the default theme's fixes; a file you did not eject does.
- Tailwind classes work in your files: the core's build scans `src/`.

## 4. Where a part gets its data

You never fetch data or call the backend. The core works a page out and hands it over in one of three ways, written
in the SDK's types:

- **A page model through a hook**: the product page, the category listing and search, the cart and the account pages
  are browser parts that read their page with a hook (`useProductPage()`, `useListingPage()`, `useCartPage()`,
  `useOrdersPage()`...). The model holds the data, the state and the actions (`add_to_cart()`, `set_quantity()`).
- **Props for server parts**: CMS blocks, the blog, the page shell and the 404 page render on the server, as plain
  HTML. They get their data and `t` (the translator) in props. Keep them server parts: do not add `"use client"` to
  them (`t` cannot reach the browser). A browser part inside one reads its words with `useI18n()`.
- **Props for views of the core's logic**: forms (sign in, an enquiry, the newsletter...), checkout's summary and the
  page after the order get a model in props. A form's view binds its fields to the react-hook-form `form` it gets;
  validating and sending stay in the core.

Across all of them, `Storefront` hooks give what every page needs (the wishlist, the product card's state, quick add,
the menu, the search). Texts come through `t()` with the shop's messages, prices through `price()`, pictures through
the SDK's `<Media>`, links through its `<Link>` (it adds the country's prefix). The full list is [the contract](contract.md).

What a theme cannot change, on purpose: checkout's steps, forms, delivery, payment and the order button (a theme must
not be able to break an order), and everything about data, addresses and search engines.

## 5. Check the theme

```bash
pnpm check
```

It runs the types against the SDK and the default theme, rejects imports outside the contract and an override that
drops an export, and renders every page template and every part the core draws with props, with your files in place,
on sample data from the SDK (`@entirius/storefront-sdk/mocks`). A part that fails is named with its file and line:

```
render product/product-page: Cannot read properties of undefined (reading 'rows')
  at ProductDescription (src/product/description.tsx:8:32)
```

Run it before every release of the theme. It does not replace looking at the shop: a part inside a sheet (the
address form) renders nothing on the server, so only its loading is checked.

## 6. Release the theme

A shop installs your theme as a package of a given version, from a registry: npm, or a private one (GitHub
Packages, GitLab, Verdaccio...).

1. In `package.json`: a name in your scope (`@acme/theme-my-theme`), a version, and remove `"private": true`. `"files"`
   already lists `src` and `theme.json`, which is all a shop needs. `theme.json`'s `name` is the theme's display
   name: it need not follow the package's.
2. The registry of your scope in `.npmrc` (`@acme:registry=https://...`), with its token if it is private.
3. ```bash
   pnpm check
   pnpm publish
   ```

   In a git repository pnpm publishes only a clean tree on the main branch; commit first, or add `--no-git-checks`.

A shop then names `@acme/theme-my-theme@1.3.0` in its build ([the shop guide](shop.md)). Every change is a new version;
a published version is never changed.

To see the theme as a production shop before that, `pnpm build` makes an image of the shop with this theme, tagged
`<the theme folder's name>:local` (`--tag <image>` for another), and prints how to run it. It takes `_CONFIG.dev`, a
configuration for development (developer tools on, links to `localhost:3100`): `--config <folder>` builds with a
shop's configuration instead.

## 7. A new platform release

The four `@entirius/*` packages and the three images always share one version. To move a theme to a new release, set
the new version for all three packages in `package.json`, then:

```bash
pnpm install
pnpm overrides     # ✓ marks your files; read the release notes for the ones the release touched
pnpm check
pnpm dev           # the dev image of the new version
```

A pre-release (`0.2.0-beta.1`, `0.2.0-rc.1`: a build of the core to try before its release, published as npm's
`next`) is set the same way, by its exact version without `^`: no range picks it up by itself.

## When something does not work

| What you see | Why, and what to do |
|---|---|
| `pnpm install` keeps the old version of a fresh release | pnpm waits a day before it installs a new package. The theme's `pnpm-workspace.yaml` exempts `@entirius/*`; for `pnpm create` name the version: `pnpm create @entirius/theme@<version>`. A stale lockfile can keep old versions: `rm -rf node_modules pnpm-lock.yaml && pnpm install`. |
| `pnpm create` runs an older generator | pnpm caches it; clear pnpm's cache (`pnpm store path`, and `dlx` in pnpm's cache folder) or name the version. |
| The shop shows no products | The backend's address, channel or key in `_CONFIG.dev`, or the backend does not accept `http://localhost:3100` (CORS). |
| Your file has no effect | A path or an export that differs from the default file's: `pnpm overrides` shows ✓ next to the files the theme replaces, `pnpm check` names a missing export. |
| Types of `@theme/...` or the SDK do not resolve in the editor | `pnpm install` in the theme's folder; the editor uses the theme's `tsconfig.json`. |
| `Cannot find package 'clsx'` (or `lucide-react`...) in your files or in `pnpm check` | A theme created before `0.1.0-alpha.8` lacks the `publicHoistPattern` of the template's `pnpm-workspace.yaml`: copy it from a new theme, then `pnpm install`. |
| `pnpm create` prints `Usage:` | A generator before `0.1.0-alpha.8` lost the folder name: name the version, or put `--` before the name. |
