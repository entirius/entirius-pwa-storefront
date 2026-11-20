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

### Added

- `docker/try-themes.sh`: the theme flow before anything is public, from a checkout: a local registry, the core's
  images and the four `@entirius` packages in one command.
- A theme sets its colours and shapes in `tokens.css` (`@theme/tokens.css`, between `app/globals.css` and the shop's
  `_CONFIG/theme.css`). `pnpm create @entirius/theme <name> --example` starts from a theme with a look of its own; the
  first `entirius dev` asks for the backend, channel and checkout key; `entirius build` makes a production image of
  the shop from the theme's folder. The `@entirius` packages are `0.1.0-alpha.6`.
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
