# Configuration

The storefront reads its configuration from `_CONFIG/`, imported directly by the code (JSON and CSS) or read at
runtime (the optional message overrides).

## Config System

`_CONFIG/` is gitignored. `_CONFIG.example/` is the committed template.

```bash
cp -r _CONFIG.example _CONFIG
# app.config.json       → API_BASE_URL (backend URL), site name and URL, THEME, BRAND
# channels.config.json  → CHANNEL_LABEL and API_CHECKOUT_KEY per channel
# countries.config.json → country → languages/currencies/channels mapping
# brand/                → identity assets (favicon, optional logo), named in app.config.json BRAND
# theme.css             → client theme: values of the theme variables of app/globals.css (empty = default look)
# messages.config.json  → optional: overrides of single interface messages per language
```

Import configs directly: `import countries from "@/_CONFIG/countries.config.json"`. Config is type-checked at build
time, so `_CONFIG/` must exist before `pnpm dev` / `pnpm build`.

The template ships the two channels of the reference dataset (`default-europe`, `default-local`); replace
`API_CHECKOUT_KEY` with the key issued by your backend for each channel.

## Config Variables

| File | Key | Purpose |
|------|-----|---------|
| `app.config.json` | `API_BASE_URL` | Backend URL (template `http://localhost:8000`; the zeno local stack serves `:8100`) |
| `app.config.json` | `DEBUG_MODE` | Request/response logging of `_LOGGER` and DEBUG-only dev tools; errors and warnings are always logged |
| `app.config.json` | `THEME` | `"light"` (default) or `"dark"`: which semantic colour set of `app/globals.css` applies |
| `app.config.json` | `SITE_URL` | Public URL of the shop: canonical/Open Graph URLs, Playwright `baseURL` |
| `app.config.json` | `SITE_NAME` | Shop name: header wordmark (when no logo), page titles, Open Graph |
| `app.config.json` | `BRAND.LOGO` / `BRAND.LOGO_ALT` / `BRAND.FAVICON` | File names in `_CONFIG/brand/`, served by `app/brand/[file]` (only the listed names). `LOGO: null` shows the wordmark |
| `app.config.json` | `BRAND.ICON_192` / `BRAND.ICON_512` / `BRAND.ICON_MASKABLE` | Optional PNG app icons in `_CONFIG/brand/`. Any of them switches on `/manifest.webmanifest` (linked from every page); `ICON_192` is also the Apple touch icon (and the page icon when `FAVICON` is unset). `null` = no manifest |
| `app.config.json` | `BRAND.OG_IMAGE` | Optional file in `_CONFIG/brand/`: default Open Graph / Twitter image of pages without a picture of their own (product, category, CMS). `null` = none |
| `app.config.json` | `BRAND.THEME_COLOR` / `BRAND.BACKGROUND_COLOR` / `BRAND.SHORT_NAME` | Optional: browser `theme-color` and manifest `theme_color`; manifest `background_color` (default: omitted); manifest `short_name` (default `SITE_NAME`) |
| `channels.config.json` | `{channel}.CHANNEL_LABEL` | Channel display name |
| `channels.config.json` | `{channel}.API_CHECKOUT_KEY` | Checkout API key per channel (`x-api-key`) |
| `countries.config.json` | `{country}.default_language` | Default language for country (the `lg` cookie: interface language and the API `language`) |
| `countries.config.json` | `{country}.default_currency` | Default currency for country |
| `countries.config.json` | `{country}.default_channel` | Default channel for country |

## Client theme (`theme.css`)

Loaded in `app/layout.tsx` right after `app/globals.css`, so it overrides the values of the theme variables
(`--primary`, `--radius`, …) without touching components. Fonts: set `--font-family-sans`; self-host them with
`@font-face` and `url("./assets/...")` relative to the file. The dark set sits under `html.dark`, which a `:root`
rule in the theme cannot beat. `--leading` is the colour of CMS dyes (`bg-leading`, `text-leading`); white text
sits on it. Layout slot wrappers carry `data-layout-slot="<slot>"` for theme rules.

## Message overrides (`messages.config.json`)

Optional, read at runtime (not imported — no file, no overrides): `{ "pl": { "cart.checkout": "Idź do kasy" } }`.
Keys are the ones of `lib/i18n/messages/en.ts`; see [patterns](patterns.md#translations-and-prices).

## Cookie banner

No config: when the backend has a published banner for the channel (django-agreements 2.2.0 or newer), the
storefront shows it with every text from the backend; otherwise nothing is loaded. See
[architecture](architecture.md#cookie-consent).
