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
│       └── user-handler/         # Double-opt-in activation landing
├── components/ui/                # shadcn/ui components
├── lib/
│   ├── i18n/                     # Messages (messages/en.ts, pl.ts), t(), price(), server loader
│   ├── auth-client.ts            # Login/signup/activate/logout against Accounts
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
| `lib/prefetch_boundary.tsx` | `PrefetchBoundary` — server prefetches TanStack queries, dehydrates, wraps children in `HydrationBoundary` |
| `lib/auth-client.ts` | Client-side auth flows: login, signup, double-opt-in activation, logout |
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
  → sets lg, cr, ch, ch_key, cid cookies (at/rt/uid are owned by the auth Server Actions)

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
- `?variant=<sku>` is set once the choice names a variant and is read on SSR. A variant has no url_key; links to
  one go to `/product/<parent_url_key>?variant=<sku>` (search rows do this).
- The cart gets the variant SKU and the name `Product (option, option)`; the gallery follows the variant when it
  has pictures of its own.

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
