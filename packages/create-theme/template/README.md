# {{name}}

A theme for the Entirius storefront. The core (pages, data, cart, checkout, SEO) runs in a container; this folder
holds only what looks different from the default theme.

- `pnpm dev`: the shop with this theme on http://localhost:3100. The first run asks for your backend (URL, channel,
  checkout key) and writes `_CONFIG.dev`; change it there any time. Saving a file in `src/` shows on the next page
  load. Colours and shapes live in `src/tokens.css` (`pnpm eject tokens.css`).
- `pnpm overrides`: the default theme's files you can override, and the ones you do (`pnpm list` is pnpm's own).
- `pnpm eject <path>`: copies a default file to `src/<path>`; from then on that copy is used everywhere, the rest
  still comes from the default theme. Eject only what you change: a copy no longer gets the default theme's fixes.
- `pnpm build`: a production image of the shop with this theme and `_CONFIG.dev` (`--tag`, `--config <dir>`).
- `pnpm check`: types against the SDK, imports only from the theme's contract, an override keeps the exports of the
  file it replaces.

Data and actions come from `@entirius/storefront-sdk` (a page's model, `useProductCard`, `Media`, `RichText`,
`Link`, `useI18n`), other theme components from `@theme/...`, never a path into the default theme.

To build a shop with this theme, publish it to your registry: give it your scope (`@acme/theme-{{name}}`), drop
`"private": true`, `pnpm publish`. A shop's image installs it by version (`storefront build @acme/theme-{{name}}@1.0.0`);
only `src/` and `theme.json` go into the package.
