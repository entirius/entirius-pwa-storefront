# Configuration

The storefront reads its configuration from `_CONFIG/`, imported directly by the code (JSON and CSS) or read at
runtime (the optional message overrides).

## Config System

`_CONFIG/` is gitignored. `_CONFIG.example/` is the committed template.

```bash
cp -r _CONFIG.example _CONFIG
# app.config.json       → API_BASE_URL (backend URL), site name and URL, THEME, BRAND
# channels.config.json  → CHANNEL_LABEL and API_CHECKOUT_KEY per channel (optional API_CONTACT_FORMS_KEY, API_NEWSLETTER_KEY, API_AGREEMENTS_KEY)
# countries.config.json → country → languages/currencies/channels mapping
# brand/                → identity assets (favicon, optional logo), named in app.config.json BRAND
# theme.css             → client theme: values of the theme variables of app/globals.css (empty = default look)
# fonts.ts              → typefaces of the shop, loaded through next/font (template: Inter and Lexend Deca)
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
| `app.config.json` | `SITE_URL` | Public URL of the shop: canonical/Open Graph URLs, Playwright `baseURL`, and the payment return URL: the success page a payment gateway (PayU, Stripe) sends the customer back to, sent as `continue_url` of `PATCH carts/{id}/payment/`. Only an `https` URL is sent; on `http` (local dev) the gateway falls back to its own default. The backend checks the return URL against its payment redirect settings (`PAYMENT_REDIRECT_ALLOWED_HOSTS` must hold the shop's host, platform 4.2 upgrade notes) and answers a refused one with 400, which stops the payment step |
| `app.config.json` | `SITE_NAME` | Shop name: header wordmark (when no logo), page titles, Open Graph |
| `app.config.json` | `CLIENT_IP_HEADER` | Optional name of the request header in which the hosting edge passes the visitor's address to the shop, e.g. `"cf-connecting-ip"` (Cloudflare) or `"x-real-ip"`; a list (`x-forwarded-for`) gives its last entry, the address the closest proxy saw. The login goes from the shop's server to accounts (`app/session/login`), so without it the backend's per-address limits (accounts 6.0.2: 30 logins a minute; access: failed logins) count every visitor as the shop's server and lock everybody out at once. With it the shop sends the visitor's address as `X-Client-IP`; the backend reads it only from the addresses listed in its `CLIENT_IP_TRUSTED_PROXIES` (the shop's server; `CLIENT_IP_FORWARDED_HEADER` keeps its default `HTTP_X_CLIENT_IP`). `entirius-django-access` 1.1.0 still counts its failed logins per server address (100 in 15 minutes); the fix that reads `X-Client-IP` there too is pending upstream. Name only a header the edge always sets itself: a header the visitor can send would let them pick their own counter. `null` (default) = nothing is sent |
| `app.config.json` | `BRAND.LOGO` / `BRAND.LOGO_ALT` / `BRAND.FAVICON` | File names in `_CONFIG/brand/`, served by `app/brand/[file]` (only the listed names). `LOGO: null` shows the wordmark |
| `app.config.json` | `BRAND.ICON_192` / `BRAND.ICON_512` / `BRAND.ICON_MASKABLE` | Optional PNG app icons in `_CONFIG/brand/`. Any of them switches on `/manifest.webmanifest` (linked from every page); `ICON_192` is also the Apple touch icon (and the page icon when `FAVICON` is unset). `null` = no manifest |
| `app.config.json` | `BRAND.OG_IMAGE` | Optional file in `_CONFIG/brand/`: default Open Graph / Twitter image of pages without a picture of their own (product, category, CMS). `null` = the image generated from `SITE_NAME` (`/og-image.png`); `BRAND.LOGO` also goes into the home page's JSON-LD `Organization` |
| `app.config.json` | `BRAND.THEME_COLOR` / `BRAND.BACKGROUND_COLOR` / `BRAND.SHORT_NAME` | Optional: browser `theme-color` and manifest `theme_color`; manifest `background_color` (default: omitted); manifest `short_name` (default `SITE_NAME`) |
| `app.config.json` | `CSP` | Optional extra sources of the Content-Security-Policy per directive, e.g. `{ "script-src": ["https://www.googletagmanager.com"], "connect-src": ["https://www.google-analytics.com"], "frame-src": ["https://secure.payu.com"] }`: a deployment's analytics, payment widget or CDN. The shop's own sources (self, the API origin, the nonce) are always there (`lib/csp.ts`) |
| `app.config.json` | `DELIVERY_POINTS` | The pickup point picker of the shipping step, for a method of type `inpost` or `pickup_point`. `GOOGLE_MAPS_API_KEY` (a browser key of the Maps JavaScript API with Geocoding, restricted to the shop's domains) and `GOOGLE_MAPS_MAP_ID` (Advanced Markers need one) add a map beside the list; with either empty the picker works without a map, and the CSP gets Google's sources only when both are set. `TYPES_BY_METHOD` names the point types of a method by its code (`{ "pickup-point": ["showroom", "retail_store"] }`); unnamed, `inpost` takes InPost lockers and `pickup_point` every type (`lib/delivery-points/point-types.ts`). The map has not been run against the live API yet: check it when you first set a key |
| `app.config.json` | `CHECKOUT.TERMS_ROUTE` / `CHECKOUT.PRIVACY_ROUTE` | Optional CMS routes (e.g. `"terms"`) of the terms and privacy pages, used only when the agreement definitions of `django_agreements` name none: their `content_route` is the route of every legal link (see [architecture](architecture.md#agreements-at-checkout)). `null` = the page name without a link |
| `app.config.json` | `CONTACT_FORMS.NOTIFY_ATTRIBUTES` | Optional list of attribute idxs (e.g. `["brand", "series"]`). Their values on a sold-out product go into its "tell me when a similar product arrives" request, keyed by idx. Empty (default) = the request carries SKU, name and category only |
| `app.config.json` | `PRODUCT.RELATED` | Optional list of rules for the "similar products in stock" section of the product page. A rule is attribute idxs and/or `category` joined with `+` (all must match), e.g. `["series+category", "category"]`; rules are tried in order and each fills up what the previous left (8 tiles at most). A rule naming an attribute the product lacks is skipped. The product's value of an attribute is its first value; its category is the one with the deepest path. Default `["category"]`; `[]` = no section |
| `app.config.json` | `PRODUCT.KEY_FACTS` | Optional list of up to three attributes printed as one line under the price: an idx or `{ "idx": "height", "label": "H" }`. A number prints as `<label> <value> <unit>` (the label defaults to the attribute name without its "(unit)"), any other value as the value alone. Default none |
| `app.config.json` | `PRODUCT.STORY_ATTRIBUTES` | Optional list of attribute idxs shown as their own section after the specification instead of a specification row. A TEXT attribute whose value is HTML is always shown that way; this list adds attributes with plain long text. Default none |
| `app.config.json` | `SEO.PRODUCT_META` / `SEO.PRODUCT_JSONLD` / `SEO.CATALOG_META` / `SEO.CATALOG_JSONLD` | Where the product and category head and JSON-LD read their fields: tuples `[outKey, source, transform?]`. `source` is a dot-path into the raw API object (`"brands.0.name"`) or a fallback list of them; `transform` is a name or a list of names from `lib/seo/transforms.ts` (`strip_html`, `truncate:160`, `media_urls`, `take:1`, `absolute_url`, `availability`, `upper`), run on each candidate, the first non-empty result wins. The out keys are those `lib/seo/build.ts` reads (`title`, `description`, `images` / `image`, `noindex` / `nofollow`, `availability`, ...) |
| `app.config.json` | `MENU_CINFGURATION.TOP_ROW_MAX_ITEMS` | How many categories of a desktop megamenu may share the header's top row with the centred logo, from 1280 px up. With more of them, or with very long names, the whole menu takes its own row under it. Default `3`; `0`: always its own row |
| `app.config.json` | `CATALOG.SORT_IN_STOCK_FIRST` | When `true`, a sort chosen by the shopper is sent as `s_on_stock=desc` first, so in-stock products stay ahead of sold-out ones. Default `false`: the API order is kept |
| `channels.config.json` | `{channel}.CHANNEL_LABEL` | Channel display name |
| `channels.config.json` | `{channel}.API_CHECKOUT_KEY` | Checkout API key per channel (`x-api-key`) |
| `channels.config.json` | `{channel}.API_CONTACT_FORMS_KEY` | Optional contact-forms API key per channel (`X-API-KEY`, scope `contact_form`). `proxy.ts` sends it as the `cf_key` cookie. Without it no contact form is offered |
| `channels.config.json` | `{channel}.API_NEWSLETTER_KEY` | Optional newsletter key per channel (`X-API-KEY` of `agreements/v2/{channel}/newsletter/subscribe/`, a token with the scope `agreements.subscribe`). `proxy.ts` sends it as the `nl_key` cookie. Without it the footer has no newsletter form and the register form no opt-in |
| `channels.config.json` | `{channel}.API_AGREEMENTS_KEY` | Optional agreements key per channel (`X-API-KEY` of `agreements/v2/{channel}/orders/{order_id}/agreements/`, today a token with the same scope `agreements.subscribe`, set apart so a deployment can use its own). `proxy.ts` sends it as the `ag_key` cookie. Without it a guest order goes through but the agreements accepted at checkout are not recorded with it (a signed-in customer's JWT still records them) |
| `countries.config.json` | `{country}.default_language` | Default language for country (the `lg` cookie: interface language and the API `language`) |
| `countries.config.json` | `{country}.default_currency` | Default currency for country |
| `countries.config.json` | `{country}.default_channel` | Default channel for country |

## Typefaces (`fonts.ts`)

`_CONFIG/fonts.ts` declares the shop's typefaces with `next/font` and exports `FONT_CLASSES`, the class names
`app/layout.tsx` puts on `<body>`. Only the fonts declared there are built, self-hosted and preloaded; each gets a
metric-matched fallback face, so the text does not jump when the font arrives. The template loads Inter (text) and
Lexend Deca (headings, prices, wordmark).

A client typeface replaces them. Put the file in `_CONFIG/assets/fonts/` and declare it under `--font-family-sans`
(text); headings follow `--font-family-brand`:

```ts
import localFont from "next/font/local";

const sans = localFont({
  src: "./assets/fonts/my-font.woff2",
  variable: "--font-family-sans",
  weight: "100 900",
});

export const FONT_CLASSES = sans.variable;
```

```css
/* theme.css: headings in the same face. The variable sits on <body>, so :root cannot read it. */
body {
  --font-family-brand: var(--font-family-sans);
}
```

A second face for headings is a second `localFont` call with `variable: "--font-family-brand"`, its `.variable`
added to `FONT_CLASSES`. `next/font` takes literal options only, which is why this is a file and not a key of
`app.config.json`. A font declared with `@font-face` in `theme.css` still works, but the browser finds it only after
the stylesheet, and the fonts of `fonts.ts` are preloaded on top of it.

Migration: a `_CONFIG/` made before this file existed needs it. Copy `_CONFIG.example/fonts.ts` for the previous
behaviour; the build stops with `Module not found: '@/_CONFIG/fonts'` without it.

## Client theme (`theme.css`)

Loaded in `app/layout.tsx` right after `app/globals.css`, so it overrides the values of the theme variables
(`--primary`, `--control-radius`, …) without touching components. `--control-radius` is the corner of every control
of one height (buttons, inputs, select, input group, quantity stepper; default 8px, `0` = square); `--chip-radius` the corner
of outlined round icon buttons (wishlist, gallery and carousel arrows) and text chips (sort, subcategories; default
`9999px`, a pill). Also overridable: `--spacing-touch` (minimum touch target) and `--swatch-cross` (the stroke over an unavailable colour
swatch). Migration: text buttons used to be pills (`rounded-full`); they now take `--control-radius` (8px). A theme that
wants pill buttons sets `--control-radius: 9999px`, which rounds the inputs, select and stepper the same way. Section containers (`surface`, `surface-sm`, `surface-divided`) read `--surface-bg`, `--surface-radius`,
`--surface-padding` / `--surface-padding-lg` / `--surface-padding-sm` and `--surface-divider`; a flat theme sets the
background to `transparent`, paddings and radius to `0` and the divider to `var(--border)`, and the content lines up
with the breadcrumbs. `surface-outline` keeps its border, the brand radius (`rounded-lg`) and `--surface-outline-padding`; `--surface-backdrop` is the
category header's gradient (`none` turns it off). Other panel and card
corners come from `--brand-radius-*`, and `--radius` only reaches the cookie banner's dialog. Fonts live in `fonts.ts` (below), not in the theme. The dark set sits under `html.dark`, which a `:root`
rule in the theme cannot beat. `--leading` is the colour of CMS dyes (`bg-leading`, `text-leading`); white text
sits on it. `--product-image-ratio` (width / height, default `1 / 1`) shapes every product photo: listing, PDP gallery,
cart, checkout, search, wishlist. Layout slot wrappers carry `data-layout-slot="<slot>"` for theme rules, and every CMS section and tile
sits in a `display: contents` wrapper with `data-cms-type="<core_type>"`. The product page root carries `data-product-page`,
the category header `data-catalog-header`; product tiles and search rows carry `data-product-tile` and
`data-stock="in|out"`, and an out-of-stock tile's label `data-sold-out-label`.

## Message overrides (`messages.config.json`)

Optional, read at runtime (not imported — no file, no overrides): `{ "pl": { "cart.view": "Pokaż koszyk" } }`.
Keys are the ones of `lib/i18n/messages/en.ts`; see [patterns](patterns.md#translations-and-prices).

`checkout.transfer_next` is empty by default. A shop that takes offline bank transfers sets it per language
(for example the time limit for the payment): the line then shows on the review step and on the success page for
the transfer payment method, next to a button that copies the payment details (the method's description from the
backend, the amount and the order number). The description itself comes from the payment method in the backend.

## Cookie banner

No config: when the backend has a published banner for the channel (django-agreements 2.2.0 or newer), the
storefront shows it with every text from the backend; otherwise nothing is loaded. See
[architecture](architecture.md#cookie-consent).
