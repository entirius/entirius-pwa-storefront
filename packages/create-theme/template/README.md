# {{name}}

A theme for the Entirius storefront. The core (pages, data, cart, checkout, SEO) runs in a container; this folder
holds only what looks different from the default theme.

- `pnpm dev`: the shop with this theme on http://localhost:3100. The first run writes `_CONFIG.dev`: set your backend
  in it (`API_BASE_URL` in `app.config.json`, your channel and its `API_CHECKOUT_KEY` in `channels.config.json`, the
  countries in `countries.config.json`), then run it again. Saving a file in `src/` shows on the next page load.
- `pnpm overrides`: the default theme's files you can override, and the ones you do (`pnpm list` is pnpm's own).
- `pnpm eject <path>`: copies a default file to `src/<path>`; from then on that copy is used everywhere, the rest
  still comes from the default theme. Eject only what you change: a copy no longer gets the default theme's fixes.
- `pnpm check`: types against the SDK, imports only from the theme's contract, an override keeps the exports of the
  file it replaces.

Data and actions come from `@entirius/storefront-sdk` (a page's model, `useProductCard`, `Media`, `RichText`,
`Link`, `useI18n`), other theme components from `@theme/...`, never a path into the default theme.
