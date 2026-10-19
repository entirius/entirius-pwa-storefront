# Architecture

How the storefront is laid out and configured. Rules for agents and contributors live in [AGENTS.md](../AGENTS.md).

## Layout

```
entirius-pwa-storefront/
├── API/                          # Fetch engine (not Axios, not a generated client)
│   ├── api.routes.ts             # Route constants + API_ROUTES_POLICY
│   ├── api.setup.ts              # create_fetch_engine() — returns FETCH_METHOD
│   ├── api.context.ts            # create_api(cookie_access) — wires access into engine
│   ├── api.d.ts                  # COOKIE_ACCESS interface
│   └── access/
│       ├── api.server-access.ts  # make_server_access() — uses next/headers (RSC only)
│       ├── api.client-access.ts  # make_client_access() — uses document.cookie
│       └── api.static-access.ts  # static values for ISR/build-time fetches
├── app/
│   ├── layout.tsx                # Root layout (providers, fonts, language, layout slots, cookie banner)
│   ├── _components/layout/       # Header, footer, navigation, search, cart link, wishlist/account sheets
│   ├── _components/layout-slots/ # CMS content on every page (announcement, before-footer)
│   ├── _components/cookie-consent/ # Cookie banner on django-agreements
│   └── [customer_country]/       # All routed pages live under the country segment
│       ├── (builder)/[[...slug]] # CMS/builder pages (catch-all)
│       ├── (catalog)/catalog/[catalog_url_key]/  # Listing page
│       ├── (product)/product/[product_url_key]/  # PDP
│       ├── checkout/             # Address → shipping → payment → review stepper
│       ├── profile/              # Account: profile, addresses, orders
│       ├── reset-password/       # Landing of the password reset mail (new password from ?key=)
│       └── user-handler/         # Double-opt-in activation landing
├── components/ui/                # shadcn/ui components
├── lib/
│   ├── i18n/                     # Messages (messages/en.ts, pl.ts), t(), price(), server loader
│   ├── auth-client.ts            # Login/signup/activate/password/logout against Accounts
│   ├── prefetch_boundary.tsx     # Server-side TanStack Query prefetch + hydration
│   ├── link-dynamic.tsx          # Dynamic import wrapper
│   ├── logger.ts                 # _LOGGER (respects DEBUG_MODE from config)
│   └── utils.ts                  # cn() utility
├── providers/
│   ├── auth.provider.tsx         # Per-request logged-in flag (seeded server-side)
│   ├── i18n.provider.tsx         # useI18n() for client components (seeded by the root layout)
│   └── Tanstack-query.provider.tsx
├── stores/                       # Zustand cart + wishlist, cart query & sync hook
├── utils/
│   ├── NORMALIZERS/              # Data transformation (product, price, media, cart, order)
│   ├── validation/               # Zod schemas (auth, address, customer address)
│   └── cookies-setter.helper.ts  # Geo/Cloudflare cookie resolution (proxy.ts)
├── types/                        # Shared TypeScript types
├── proxy.ts                      # Next.js middleware — geo routing + cookie injection
└── _CONFIG.example/              # Committed config templates (copy to _CONFIG/)
    ├── app.config.json           # API_BASE_URL, DEBUG_MODE, THEME, SITE_NAME, BRAND
    ├── channels.config.json      # Channel labels + checkout keys
    ├── countries.config.json     # Country → language/currency/channel mapping
    └── theme.css                 # Client theme (empty = default look)
```

## File Map

| File | Purpose |
|------|---------|
| `API/api.routes.ts` | All route URL constants + `API_ROUTES_POLICY` (default query params, headers, token refresh per route) |
| `API/api.setup.ts` | `create_fetch_engine(access)` — placeholder resolution, query string, auth headers, 401 refresh |
| `API/api.context.ts` | `create_api(cookie_access)` — maps cookie keys to access methods, returns `{ FETCH_METHOD }` |
| `proxy.ts` | Middleware: reads `ct` cookie or `cf-ipcountry`, rewrites URL to `/{country}/...`, sets session cookies |
| `app/robots.ts`, `app/sitemap.ts` | `/robots.txt` (private flows and filter URLs disallowed, sitemap named by `SITE_URL`) and `/sitemap.xml` (CMS pages, categories, products incl. sold out, read from the API at request time; every profile in its own language with hreflang alternates, each address in its canonical form, `/catalog/x` for the `default` profile, pure helpers in `lib/seo/sitemap.ts`). Dotted paths are outside the `proxy.ts` matcher |
| `lib/prefetch_boundary.tsx` | `PrefetchBoundary` — server prefetches TanStack queries, dehydrates, wraps children in `HydrationBoundary` |
| `lib/auth-client.ts` | Client-side auth flows: login, signup, double-opt-in activation, password reset and change, logout |
| `app/[customer_country]/.../{page}/api.query.ts` | Co-located query definitions (`queryKey`, `queryFn`) + `cache()`-wrapped loaders |
| `stores/cart.store.ts` | Zustand cart (flat localStorage serialization) |
| `stores/use-cart-sync.ts` | Shared create-or-patch cart sync (cart page + checkout dedupe to one backend call) |
| `stores/wishlist.store.ts` | Zustand wishlist with flat localStorage serialization (key `WL`) |
| `utils/NORMALIZERS/` | `NORM_PRODUCTS_DATA`, `NORM_FILTERS_DATA`, `NORM_MEDIA_DATA`, cart/order/price normalizers |

## Configuration

`_CONFIG/` files and every key: [configuration](configuration.md).

## Data Flow

```
proxy.ts (middleware)
  → reads ct cookie / cf-ipcountry header
  → rewrites URL to /{country}/...
  → sets lg, cr, ch, ch_key, cf_key, cid cookies (at/rt/uid are owned by the auth Server Actions)

page.tsx (Server Component)
  → make_server_access() reads next/headers cookies
  → create_api(access) wires cookie values into fetch engine
  → PrefetchBoundary runs queryFn server-side, dehydrates result

HydrationBoundary (client)
  → rehydrates TanStack Query cache
  → useQuery() reads cache — no refetch on mount
```

## Geo Routing

All pages live under `app/[customer_country]/`. The `ct` cookie (set by middleware from `cf-ipcountry` or existing cookie) determines the country segment. `countries.config.json` lists valid country keys. Unknown countries fall through to `default`.

## Component Organization

| Tier | Location | Purpose |
|------|----------|---------|
| shadcn/ui | `components/ui/` | Base primitives (Button, Input, Sheet, Carousel). Added via `pnpm dlx shadcn add <name>` |
| Shared | `lib/` | Cross-page components (PrefetchBoundary, LinkDynamic) |
| Layout | `app/_components/layout/` | Header, navigation, search, cart/wishlist/account sheets |
| Page feature | `app/[customer_country]/.../_components/` | Co-located with owning page (filters, product tile, listing) |

Client components use `.client.tsx` suffix. Server components have no suffix.

## State Management

Two patterns:

- **Server state** — TanStack Query. All API data goes through `useQuery` with co-located query definitions (`api.query.ts`). Server-prefetched via `PrefetchBoundary`, hydrated on client.
- **Client state** — Zustand:
  - `stores/cart.store.ts` and `stores/wishlist.store.ts` — persisted to localStorage with flat serialization
  - The local cart is the source of truth; the cart page and checkout sync it to the backend (`stores/cart.query.ts`).
    Only a cart created (POST) with the customer's token belongs to the account. On login `merge_cart_on_login()`
    (`stores/cart-login.ts`) adds the account's saved cart (`carts/latest/`) to the local one (a shared SKU gets the
    sum), adopts its `cart_id` and closes the guest cart; on logout the cart leaves the device and comes back with
    the next login.
  - `app/.../catalog/.../_components/filters.store.ts` — co-located with catalog page, initializes from `URLSearchParams`

## Coding Standards

Priority order for React/Next.js code:
1. Eliminate waterfalls — `Promise.all()` for independent fetches, defer awaits
2. Bundle size — no barrel imports, `next/dynamic` for heavy components
3. Server-side performance — `React.cache()` deduplication, minimize client serialization
4. Re-render optimization — derive state during render, avoid unnecessary `memo`

## Layout slots

The root layout renders CMS content above the header (`announcement`) and above the footer (`before-footer`) with
the builder's own renderer. A slot is an ordinary contentdb static page published under the reserved route
`layout-<slot>`; without that route nothing renders. The builder answers 404 for routes starting with `layout-`.
All slot pages come from one request per page render (`app/_components/layout-slots/api.query.ts`: the routes
list, then `static-page?routes=…`, deduplicated with `React.cache()`); the draft in the active language wins.

The footer is not a slot: it is the CMS footer extender (`layout-extender-published/footer/`, edited in the CMS
navigation editor), rendered by `app/_components/layout/footer-component.tsx`.

## Configurable products (variant picker)

The product page of a `CONFIGURABLE` product sells variants, never the parent SKU. `variants_query` (product
`api.query.ts`) reads `GET products/{url_key}/variants/` (axes, option labels, variant option values, `on_stock`),
then the product list by the variant SKUs for price, name and pictures; `NORM_VARIANTS_DATA` merges both.
Real-time stock of all variants is one `stock/` call with repeated `sku`.

- Any number of axes; one radio group per axis (`variant-picker.client.tsx`), selection logic in
  `variant-selection.ts`, page glue in `use-product-variants.ts`.
- Colour swatches: an axis with `widget_type: "Swatch_Visual"` draws options whose `extension.color_hash` is `#RGB` /
  `#RRGGBB` as swatches (name in `aria-label`); options without a valid hash (patterns) stay text chips.
- `?variant=<sku>` is set once the choice names a variant and is read on SSR. A variant has no url_key; links to
  one go to `/product/<parent_url_key>?variant=<sku>` (search rows do this).
- The cart gets the variant SKU and the name `Product (option, option)`; the gallery follows the variant when it
  has pictures of its own.

## Product page and catalog extras

- Gallery (`gallery.client.tsx`, `gallery-viewer.client.tsx`): a scroll-snap row (swipe on phones, "3 / 12" counter),
  arrows and a thumbnail strip from `md`, keyboard arrows; a click opens a full-screen viewer (swipe, double-tap and
  pinch zoom, Escape, focus returns to the opener). The first picture is `loading="eager"`, the rest lazy. Hooks:
  `data-gallery`, `data-gallery-thumb`, `data-gallery-counter`, `data-gallery-viewer`.
- Similar products (`related.ts`, `related-products.tsx`): server-rendered tiles (crawlable links) from the rules of
  `PRODUCT.RELATED`. Each rule asks `products/` with `q_<idx>=<value>` / `category=` and `on_stock=true`, and every
  candidate is checked again (the API ignores a filter that is not defined in the channel). Never the product itself,
  never a sold-out one; hidden when nothing matches. The server passes the section to `ProductClient`, which places
  it by stock: closing the page, or (sold out) right under the buy area with a lead line.
- Sticky buy bar (`sticky-buy-bar.client.tsx`, `data-buy-bar`, phones): slides in once `[data-buy-area]` is out of
  view (the sticky header does not count as view); price + Add to cart, or on a sold-out product "See similar"
  (link to `#related-products`) and the notify-similar action when the channel offers it. Hidden while the cookie
  banner is open (`html.show--consent`).
- No quantity stepper when the real-time stock is exactly 1. Key facts: `PRODUCT.KEY_FACTS` (`key-facts.ts`).
- Specification (`product-specs.tsx`), in the details column under the description (group names only when there are two or more groups; an empty description is not rendered): a value links to `/catalog/<category>?q_<idx>=<value>` when that attribute is a
  filter of the product's broadest category (`options/`) and offers the value. Long text: a TEXT attribute whose value
  is HTML, or an idx of `PRODUCT.STORY_ATTRIBUTES`, becomes a section of its own (`product-stories.tsx`,
  `is_story` in `lib/rich-html.ts`); external links open in a new tab. A description without HTML keeps its paragraphs.
- Catalog: pagination above and below the list (both scroll to `[data-catalog-list]`); `CATALOG.SORT_IN_STOCK_FIRST`
  (`lib/stock-sort.ts`, applied in `load_catalog`). A tile of an in-stock product with exactly one piece shows message
  `product.single_piece` and `data-single-piece` (empty message = off, no request; `lib/stock-batch.ts` batches the
  tiles' stock lookups of one list into one `stock/` call).
- CMS buttons of type `catalog` / `product` (and `internal` `/c/…` / `/p/…`) link with the url key of the active
  language (`lib/url-keys.ts`, query `["url-key", language, kind, key]`, prefetched by the builder page); any failure
  keeps the key the editor typed.

## Contact forms

Forms of the `django_contact_forms` module (`/api/contact-forms/v2/{channel}/...`), all optional. A form shows only
when the channel has `API_CONTACT_FORMS_KEY` (`channels.config.json`) AND `form-types/` lists the form's type;
`lib/contact-forms.ts` holds the check (`useContactFormAvailable`) and the submit. No key, a refused key (401) or
an unknown type: nothing renders and nothing is requested.

- Enquiry (`components/enquiry-form.client.tsx`): honeypot field `website`, required consent with a link to
  `CHECKOUT.PRIVACY_ROUTE`. The product page offers it as a collapsed "Ask about this product" (type
  `product-enquiry`, slug `product-enquiry`, `code` = SKU); a product without a price (`purchasable` false) gets the
  primary "Ask for the price" instead.
- "Tell me when a similar product arrives" (`components/notify-similar.client.tsx`, type `notify-similar`, slug
  `notify-similar`): on a sold-out product (stock answered, nothing buyable; `code` = SKU) and on an empty category
  page without filters. E-mail, optional note, consent, honeypot. Body: `product_sku`, `product_name`, `category`,
  the values of `CONTACT_FORMS.NOTIFY_ATTRIBUTES` (`lib/notify-body.ts`), `note`, `language`.
- CMS block: a section (`section-type-a`) description with `<div data-enquiry-form data-slug="contact" data-type="general"></div>`
  shows the form in place of the marker (`lib/enquiry-marker.ts`). `data-slug` names the form in the inbox (default
  `contact`), `data-type` is the contact-forms type it is sent as (default `general`); keep the marker a top-level
  element, not inside a `<p>`.
- The backend needs a `Channel` (`idx` = the channel), an `APIKey` with scope `contact_form` for it and one
  `FormType` per code used above.

## Cookie consent

`app/_components/cookie-consent/`, mounted as `<CookieConsent />` in `app/layout.tsx`. After hydration it asks
`GET /api/agreements/v2/__CHANNEL__/cookie-banner/` (django-agreements >= 2.2.0) through the API layer.

- No banner on the backend (404, module absent): nothing is loaded, and the answer is cached for the session.
- With a banner, `consent-banner.ts` loads `vanilla-cookieconsent` and `cookie-consent.css` as a separate chunk.
  Every text comes from the backend; never put banner copy in the storefront.
- Decisions go to `POST .../cookie-consents/`; a 409 means a newer banner was published: refetch and ask again.
- Any link whose `href` ends with `#cookie-consents` reopens the preferences; `app/globals.css` hides such links
  until a banner runs. A CMS button of type `external` with a `#…` url stays in the same tab.
- The storefront ships no tags: `apply_consent()` in `consent-mode.ts` is the one place a tag learns about the
  decision (Consent Mode signals).
- The library hides the banner from bots (`navigator.webdriver` included): a Playwright check has to override that.
