# @entirius/theme-cli

The `entirius` command of an Entirius storefront theme, run in the theme's folder (the theme's scripts call it):

| Command | What it does |
|---|---|
| `entirius dev` | The shop with this theme on http://localhost:3100: the core in the `storefront-dev` container of the SDK's version, `src/` mounted. The first run asks for the backend, channel and checkout key. |
| `entirius build` | A production image of the shop with this theme and `_CONFIG.dev`. |
| `entirius list [--all]` | What a theme can override, by where it shows; ✓ at the theme's own files. |
| `entirius eject <path>` | Copies a default file to `src/<path>`. |
| `entirius check` | Types, imports outside the contract, an override's exports, and every template rendered with the theme on sample data. |

Needs Docker for `dev` and `build`. [Building a theme](https://github.com/entirius/entirius-pwa-storefront/blob/develop/docs/themes/guide.md).

License: MPL-2.0.
