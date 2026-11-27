# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- The page shell is the theme's: header, footer, megamenu, mobile menu, search, account, cart link, wishlist sheet,
  locale switch, notices and breadcrumbs moved from `app/_components/layout/` to `@theme/layout/*` (breadcrumbs:
  `@theme/components/page-breadcrumbs`). The core works the layout out in `lib/layout/` (`LayoutRuntime`, `useLayout()`,
  `Storefront` hooks), the search query is `lib/search/`, the account forms are `components/*-form.client.tsx`, the
  cart's price and discount code `app/_components/order/`. The shop looks and works as before.
- The product page is a theme template: `@theme/product/product-page` arranges named parts (`gallery`, `header`,
  `price`, `stock-status`, `variant-picker`, `buy-box`, `description`, `specs`, `stories`, `related`,
  `sticky-buy-bar`), each reading the page from `useProductPage()`; the core works the page out in
  `ProductPageRuntime`. The product card (`@theme/components/product-card`), price, badges, quick add, wishlist
  button and thumb moved into the theme, `MediaImage` / `SanitizeHTML` into the SDK as `Media` / `RichText`. The
  shop looks and works as before. `pnpm test:e2e:theme` checks a theme's override (`tests/theme-example/`).
- The category listing and the search results are a theme template: `@theme/catalog/listing-page` arranges named
  parts (`listing-header`, `filters`, `sort-options`, `filter-range`, `filter-options`, `filters-sheet`,
  `pagination`, `product-grid`, `listing-empty`), each reading the list from `useListingPage()` and the filter
  panel's hooks; the core works the list out in `ListingPageRuntime` (query, filters in the URL, pages). The shop
  looks and works as before.
- The cart page is a theme template: `@theme/cart/cart-page` arranges `cart-line`, `cart-summary` and `cart-bar`,
  reading the cart from `useCartPage()` (`CartPageRuntime` in the core). The page header, the order steps, the unit
  price and the summary card moved to `@theme/order/*` and serve checkout too; checkout works as before.
- A shop's image is two-stage: built on `storefront-builder`, run on the new `storefront-runtime` image with Next's
  standalone server (`storefront build` puts it in `/app/out`), about 450 MB instead of 1.5 GB. The builder and dev
  images install production dependencies only (1.17 GB from 1.31 GB): what `next build` needs (Tailwind, TypeScript,
  the type packages, shadcn's stylesheet) moved from `devDependencies` to `dependencies`. Upgrade: a shop's
  `Dockerfile` gets the second stage (`FROM storefront-runtime:<version>`, `COPY --from=build /app/out /app`); a
  single-stage one still runs, as large as before.
- Dependencies at their current versions: React 19.3.1, TanStack Query 5.108, Radix 1.8, Zustand 5.1, React Hook Form
  7.92 with `@hookform/resolvers` 7 (the form schemas no longer need a cast), DOMPurify 3.4.18 through
  `isomorphic-dompurify` 4.8 (it escapes `<` and `>` inside attribute values), ESLint 10, Vitest 5.1, Playwright 1.65;
  `minimatch` is held at a patched version (GHSA-g3hv-75wg-m249, through `shadcn`). The images and CI run Node 24
  (the core's `engines`: `>=24`); the workflow actions are at their current major versions. TypeScript stays at 6:
  `typescript-eslint` does not support 7 yet.
- One pnpm for the core: `packageManager` in `package.json` (pnpm 12.21, also pinned in the lockfile) is the version CI,
  the images and the core's developers run; CI and the images ran pnpm 10 before. Theme authors keep any pnpm from 10.
- A release of the theme platform is a GitHub release of a `v<version>` tag: `.github/workflows/publish.yml` checks the
  tag against the four packages, publishes them to npm through trusted publishing (with the `LICENSE`, under `next`
  for a prerelease) and pushes the core images for `linux/amd64` and `linux/arm64` to ghcr.io ([releasing](docs/releasing.md)).
  `entirius check` on a theme that overrides nothing yet no longer fails on TypeScript finding no input.
- Guides for a theme author and a shop builder outside the team: [building a theme](docs/themes/guide.md),
  [building a shop](docs/themes/shop.md) and [the theme contract](docs/themes/contract.md), linked from the READMEs
  of the four packages. Fixed on the way: `pnpm create @entirius/theme <name>` without `--registry` lost the folder
  name; `entirius check` could not reach the default theme's libraries under pnpm's strict layout (a new theme also
  hoists them, `publicHoistPattern`); `entirius dev` without a terminal and without its flags now writes nothing and
  names the flags; `storefront build` says when it cannot fetch the theme (its registry's `.npmrc`, a build secret).
- The last views of the core are the theme's: the similar products on the product page
  (`@theme/product/related-products`, a server part), the cookie banner's look (`@theme/cookie-consent.css`) and the
  gifts in the cart and checkout (`@theme/cart/gift-line`, `gift-picker`, `@theme/checkout/summary-gift-line`, from
  models; the cart's `blocks.gift_lines` / `blocks.gift_picker` are now `gift_lines` / `gift_picker`, checkout's
  `blocks.gift_lines` is `gift_lines`). The shop looks and works as before.
- `entirius check` renders the theme: every page template and every part the core draws with props, on the SDK's
  mocks (`@entirius/storefront-sdk/mocks`, the list in `@theme/lib/check`), with the theme's files in place and
  outside Next; a failing part is named with its file and line. The page shell (`@theme/layout/page-shell`, with the
  layout slots), the 404 page (`@theme/layout/not-found-page`, `not-found-search`), a CMS page's frame
  (`@theme/cms/cms-page`) and the cart's problems (`@theme/order/cart-alerts`, from a model; the cart's
  `blocks.alerts` is now `alerts`) are theme parts.
- The forms are theme views with their logic in the core: `@theme/forms/<name>` (login, register, forgot and reset
  password, profile, change password, address sheet, newsletter, enquiry, notify about a similar product, back in
  stock, discount code) draws the fields and the layout from a model in props typed in the SDK (`/forms`); the core
  validates, sends and keeps the state. `TokenLinks` moved into the SDK (`/components/token-links`); the SDK now
  peers on `react-hook-form` for the form types. The shop looks and works as before.
- Checkout's summary and the page after the order are theme parts (`@theme/checkout/checkout-summary`,
  `summary-line`, `success-page`, `order-receipt`), and the order totals (`@theme/order/order-totals`) serve the cart
  and checkout from a model (`order_totals()`); the steps, forms, delivery, payment and the order button stay in the
  core. Breaking for themes: the cart's `blocks.totals` is now `totals` (`OrderTotalsModel`). The shop looks and
  works as before.
- The account is a theme template: `@theme/account/account-layout` and `account-menu`, `overview-page`, `orders-page`,
  `order-page` and `addresses-page` with their parts, each reading its page from a hook of the SDK (`/account/page`)
  that a runtime in the core fills; an order's status comes as a tone the theme colours. The forms stay in the core.
  The pages of e-mail links (activation, password reset, newsletter, back in stock) draw
  `@theme/components/message-page`. The shop looks and works as before.
- CMS pages render on the server, and CMS blocks and the blog are theme parts rendered there: a block type of the
  page editor is `@theme/cms/<type>` (sections and tiles), the blog's pages `@theme/blog/blog-page`, `post-page` and
  `author-page` with their parts. The core reads what a document shows before it renders (button addresses,
  products, posts) and hands it over in props typed in the SDK (`/cms`, `/blog`); carousels and product cards stay
  browser parts inside. A CMS page loads about 28 KiB less JavaScript; the shop looks and works as before.
- `THEME` in `_CONFIG/app.config.json` is now `COLOR_SCHEME` (`"light"` or `"dark"`), so that "theme" means only the
  installed theme. Breaking: rename the key in every `_CONFIG/app.config.json`; a config with `THEME` fails the build.
- First step to themes installed on the core: a pnpm workspace with `packages/sdk` (`@entirius/storefront-sdk`:
  message catalogues, `t()`, `price()`, `useI18n`) and `packages/theme-default` (`@entirius/theme-default`: the
  shadcn/ui primitives). The core imports them as `@theme/ui/<name>`; `@theme/*` resolves to an installed theme in
  `theme/` first, then to the default theme. The shop looks and works as before. Breaking for code built on the
  template: `@/components/ui/<primitive>` → `@theme/ui/<primitive>`, `@/providers/i18n.provider` →
  `@entirius/storefront-sdk/i18n/client`, `@/lib/i18n/translate` → `@entirius/storefront-sdk/i18n`, message
  catalogues in `packages/sdk/src/i18n/messages/`.
- Header search reads the products of matrix `search/` in the shape of `products/` (matrix 5.0): the row reuses the
  catalog's product normalizer, price and thumb instead of its own mapping. Breaking: needs matrix 5.0 or later; on
  4.x the search rows show no prices and placeholder pictures.
- Typefaces moved from the root layout to `_CONFIG/fonts.ts` (`next/font`): only the faces declared there are built
  and preloaded, so a client font no longer comes with the template's Inter and Lexend Deca (208 kB) and gets a
  preload and a metric-matched fallback face. Headings without a face of their own take the text face. Breaking:
  every `_CONFIG/` needs the file; `cp _CONFIG.example/fonts.ts _CONFIG/` keeps the default look.
- A release skips a package version that is on npm already: the first version of each package goes out by hand
  ([releasing](docs/releasing.md)), and its release still pushes the images.
- Pre-releases are builds to try, for a tester or a client's staging: a GitHub pre-release from a tag
  `v<version>-beta.N` (or `-rc.N`) on `develop`, with no release commit, publishes the packages at the tag's version
  under npm's `next` and the images under that version ([releasing](docs/releasing.md)). A release (`1.2.3`) still
  needs the packages' version and a tag on `master`; the workflow refuses a release off `master`, a pre-release off
  `develop` and `master`, and a GitHub release marked the other way than its tag.
- `entirius <command> --help` (and `pnpm build --help` in a theme) prints the usage instead of running the command:
  `build --help` started a build. The theme and shop guides cover the way to a shop's image without a registry
  (`pnpm build --config <the shop's _CONFIG>`), stopping `pnpm dev` from a script, the first run's image download and
  a `--key` showing in a CI log, from a walkthrough on the public `0.1.0-alpha.9`.
- From a walkthrough of the theme and shop guides on `0.1.0-alpha.9`: the menu settings `MENU_CINFGURATION.TYPES` and
  `MENU_CINFGURATION.CONFIG_QUERY` are documented, the template's example country `uk` defaults to one of its
  languages (`en`), and the shop guide shows the whole `Dockerfile` for a private registry, the version without `^`
  and the Linux flags (`--user` when copying the configuration out, `--add-host` for a registry on the host).

### Added

- Legal pages: a contentdb `legal-page` document (terms, privacy policy: the pages django-agreements links its
  definitions to) is served at its route like a static page, when no static page holds that route; the 404 check and
  the sitemap know it too.
- A shop builds and runs without Docker: `STOREFRONT_DIR` points `storefront build` and `storefront start`
  (`docker/storefront-entrypoint.sh`) at a checkout of the core's `v<version>` tag, installed with
  `pnpm install --frozen-lockfile --prod`. Its type check (`tsconfig.build.json`) leaves out the tests and the tools'
  configs, which such a checkout cannot resolve. The build's root is the core's directory, so a checkout inside a
  shop's repository (with its own lockfile) still puts the server at `out/server.js`.
- `docker/try-themes.sh`: the theme flow before anything is public, from a checkout: a local registry, the core's
  images and the four `@entirius` packages in one command.
- A theme sets its colours and shapes in `tokens.css` (`@theme/tokens.css`, between `app/globals.css` and the shop's
  `_CONFIG/theme.css`). `pnpm create @entirius/theme <name> --example` starts from a theme with a look of its own; the
  first `entirius dev` asks for the backend, channel and checkout key; `entirius build` makes a production image of
  the shop from the theme's folder. The `@entirius` packages are `0.1.0-alpha.8`.
- A shop is a `Dockerfile` on `storefront-builder` with its `_CONFIG` and theme: `storefront build <theme package>`
  installs the theme and builds, `storefront start` serves it; the previous image is the way back. New themes publish
  only `src/` and `theme.json` and take `@entirius/*` releases at once under pnpm 11+.
- Tools for theme authors: `pnpm create @entirius/theme <name>` starts a theme folder, the `entirius` command runs
  it in the `storefront-dev` container (`dev`), lists what a theme can override, grouped by where it shows (`list`,
  from `overrides.json` of the default theme), copies a file (`eject`) and checks a theme against the SDK (`check`).
- Images of the core for themes: `docker/storefront.Dockerfile` builds `storefront-dev` (`next dev` with a mounted
  theme and configuration) and `storefront-builder` (the base of a shop's image); `docker/verdaccio/` is a local npm
  registry for the `@entirius/*` packages.
- Back-in-stock alerts: with the channel's `API_STOCK_ALERTS_KEY` a sold-out size can be selected and the product
  page offers "Tell me when it is back" (e-mail, consent, honeypot) for that SKU; a saved request stays shown as saved
  after a reload, "Notify me" in the phone buy bar scrolls to the form, and `/stock-alert/cancel?token=` cancels a
  request from the mail link. Without the key the product page is unchanged.

### Fixed

- Legal pages: the `legal-page` route is in the shared cache like the static page (every view and every 404 lookup
  asked the API). A CMS page's hidden H1 is the document's `meta.title` (its `name` is the editors' label, "Terms
  (EN)"), and a text whose HTML opens its own H1 is the page's heading: no second hidden H1, no tile title printed
  above it.
