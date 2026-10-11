# AGENTS.md -- entirius-pwa-storefront

## Quick Reference

Next.js 16 (App Router) e-commerce storefront for the Volkanos platform. React 19, TanStack Query v5, Zustand v5, Tailwind CSS v4, shadcn/ui. Consumes Matrix v2 (categories, products, prices, options, stock, search), Checkout v2 (carts, orders), Accounts v1 (customer, addresses) and ContentDB v1 (CMS pages).

## Commands

```bash
pnpm install           # Install dependencies
cp -r _CONFIG.example _CONFIG   # Required once — JSON config is imported by the code
pnpm dev               # Dev server (port 3000)
pnpm dev --port 3001   # Dev server on custom port
pnpm build             # Production build
pnpm lint              # ESLint
```

Package manager is pnpm. Do not use npm or yarn.

## Conventions

- English only: code, comments, UI copy, docs, commits, branches, PRs.
- License: MPL-2.0.
- Git flow: `master` (production) + `develop` (integration); changes land via PR.
- Default: do not commit — git is the user's call.
- Component files: `kebab-case.tsx`; client components must have `.client.tsx` suffix.
- Co-locate query definitions (`api.query.ts`) with the page that owns them.
- Normalizers live in `utils/NORMALIZERS/` — keep raw API shapes out of components.
- No barrel imports (`index.ts`) — import directly to keep bundle splitting intact.
- Use `next/dynamic` for heavy client components (carousels, sheets, modals).
- `@/` maps to repo root: `@/API/`, `@/_CONFIG/`, `@/components/`, `@/lib/`, `@/utils/`.
- API paths are a backend contract — never rewrite route constants or placeholders ad hoc.

## Commit Message Format

**NEVER add `Co-Authored-By: Claude ...` (or any other Claude/Anthropic attribution) to commit messages.**

This overrides the default Claude Code behavior of appending a `Co-Authored-By` trailer. Commit messages MUST contain only the user's authored content — no robot footer, no "Generated with Claude Code" line, no co-author trailer.

Same rule applies to PR descriptions: no `Generated with [Claude Code]` footer.

## Architecture

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
│   ├── layout.tsx                # Root layout (providers, fonts)
│   ├── _components/layout/       # Header, navigation, search, cart/wishlist/account sheets
│   └── [customer_country]/       # All routed pages live under the country segment
│       ├── (builder)/[[...slug]] # CMS/builder pages (catch-all)
│       ├── (catalog)/catalog/[catalog_url_key]/  # Listing page
│       ├── (product)/product/[product_url_key]/  # PDP
│       ├── checkout/             # Address → shipping → payment → review stepper
│       ├── profile/              # Account: profile, addresses, orders
│       └── user-handler/         # Double-opt-in activation landing
├── components/ui/                # shadcn/ui components
├── lib/
│   ├── i18n/                     # Messages (messages/en.ts, pl.ts), t(), price formatter, server loader
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
    ├── app.config.json           # API_BASE_URL, DEBUG_MODE
    ├── channels.config.json      # Channel labels + checkout keys
    └── countries.config.json     # Country → language/currency/channel mapping
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
| `stores/use-cart-sync.ts` | Shared create-or-patch cart sync (drawer + checkout dedupe to one backend call) |
| `stores/wishlist.store.ts` | Zustand wishlist with flat localStorage serialization (key `WL`) |
| `utils/NORMALIZERS/` | `NORM_PRODUCTS_DATA`, `NORM_FILTERS_DATA`, `NORM_MEDIA_DATA`, cart/order/price normalizers |

## Config System

`_CONFIG/` is gitignored. `_CONFIG.example/` is the committed template.

```bash
cp -r _CONFIG.example _CONFIG
# app.config.json      → set API_BASE_URL (Volkanos instance URL)
# channels.config.json → set CHANNEL_LABEL and API_CHECKOUT_KEY per channel
# countries.config.json → country → languages/currencies/channels mapping
# brand.config.ts     → shop name, description, logo
# theme.css           → values of the theme variables from app/globals.css (loaded after it in app/layout.tsx)
```

Import configs directly: `import countries from "@/_CONFIG/countries.config.json"`. Config is type-checked at build time.

## Translations and prices

- Active language = the `lg` cookie (set by `proxy.ts` from `countries.config.json`; the API layer sends the same value as `language`). Unknown language → `en`.
- Catalogues: `lib/i18n/messages/en.ts` is the source, one file per language next to it (`pl.ts`), typed against the keys of `en`, so a missing key is a type error. Adding a language: a file in `messages/` and one line in `lib/i18n/catalogues.ts`. Key naming is described at the top of `en.ts` (`area.snake_case`, `{placeholders}`, plural objects with `one/few/many/other` and `{count}`).
- Server components: `const { t, price } = await get_i18n()` (`lib/i18n/i18n.server.ts`). Client components: `const { t, price, text, country } = useI18n()`. Zod schemas hold keys wrapped in `msg("validation.x")`; `<FormMessage>` turns them into text (`text()` passes any other string through).
- Fallback per key: client override, language catalogue, `en`. A client overrides single messages in the optional `_CONFIG/messages.config.json`: `{ "pl": { "cart.checkout": "Idź do kasy" } }` (no file, no overrides; it is read at runtime, not imported).
- Prices: never build `"12.00 PLN"` by hand. `price(amount, currency)` formats with `Intl.NumberFormat` in the active language (`359,00 zł` for pl/PLN). `NORM_PRICE_DATA` keeps raw `{ gross, currency, final_gross? }`.
- `CmsButton` of type `external` with a url starting with `#` stays in the tab (used for the `#cookie-consents` link).

## Layout slots (CMS content on every page)

The root layout renders three slots with the builder's own renderer: `announcement` (above the header), `before-footer` and `footer`. A slot is an ordinary contentdb static page published under the reserved route `layout-<slot>` (`layout-footer`); without that route nothing renders, so a client that does not use slots is unaffected. The builder answers 404 for routes starting with `layout-`.

- All slot pages come from one cached request (`app/_components/layout-slots/api.query.ts`: the routes list, then `static-page?routes=…`; cache profile `minutes`, so CMS edits show within about a minute). Several drafts per route are allowed: the one in the active language wins, any other is the fallback.
- Footer links are CMS content, not the routes endpoint: the routes endpoint has no groups, order or external links. A footer is `section-type-a` sections of variant 4 (column of links: title, buttons as a list); a variant 4 section without buttons spans the whole row (bottom line). Variant 4 has to be offered by the CMS builder config of the client.
- Slot wrappers carry `data-layout-slot="<slot>"` for theme.css.

## Theme contract additions

`--leading` (`bg-leading` / `text-leading` of CMS dyes, default `var(--primary)`); `.cms-rich-text` is the container of CMS rich text, with default element styles in a CSS layer (a rule in `theme.css` always wins). The theme toggle button carries `data-theme-toggle` (its aria-label is translated, so do not hook on it).

## Key Patterns

### API Layer

Returns `[error, data, meta]` tuples — always destructure, never throw on API errors.

```ts
const api = create_api(await make_server_access()); // RSC/Server Action
const api = create_api(make_client_access());        // Client Component

const [error, data] = await api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
  querys: { category_url_key: 'shoes', page: 1 }  // auto-converted to query string
});
```

Route placeholders `__CHANNEL__`, `__USER_ID__`, `__CART_ID__` are resolved from cookies via the access adapter. Never call `fetch()` directly — always use `FETCH_METHOD`.

### PrefetchBoundary

Server Component prefetches TanStack Query data; Client Component reads it via `useQuery` with the same query key (no extra network request).

```tsx
// page.tsx (Server Component)
const api = create_api(await make_server_access());
return (
  <PrefetchBoundary prefetches={[catalog_query(api, opts), products_query(api, opts)]}>
    <ListingClient options={opts} />
  </PrefetchBoundary>
);

// listing.client.tsx ("use client")
const { data } = useQuery(catalog_query(make_client_access_api(), opts));
```

Use `seed` on a `PrefetchEntry` to pre-populate individual product cache entries from the list response (avoids redundant fetches on PDP navigation).

### React.cache() Deduplication

Wrap loaders in `React.cache()` (see `api.query.ts` files). Pass the **same** `api` instance to all loaders in a request — `cache()` keys on function identity + args, so duplicate `create_api()` calls break deduplication.

### Filter URL Convention

Search params use prefixes parsed in `page.tsx` before passing to `PrefetchBoundary`:
- `q_color=red` → filter value
- `s_price=asc` → sort
- `r_price=10&r_price=500` → range

The catalog page's `build_params()` helper strips prefixes before forwarding to the API.

### Configurable products (variant picker)

The product page (`product_type: "CONFIGURABLE"`) sells variants, never the parent SKU. `variants_query` (product `api.query.ts`) reads `GET products/{url_key}/variants/` (axes, option labels, variant option values, `on_stock`), then the product list by the variant SKUs for price, name and pictures; `NORM_VARIANTS_DATA` merges both. The matrix product-detail response has `variants` and `variant_options` but always empty. Real-time stock of all variants is one `stock/` call with repeated `sku`.

- Any number of axes; feature names and labels come from the backend. One radio group per axis (`variant-picker.client.tsx`), selection logic in `variant-selection.ts`, page glue in `use-product-variants.ts`.
- URL: `?variant=<sku>` is set once the choice names a variant and is read on SSR. A variant has no url_key; links to one go to `/product/<parent_url_key>?variant=<sku>` (search rows do this).
- Cart gets the variant SKU and the name `Product (option, option)`. Gallery follows the variant if it has pictures of its own.
- `API_PRODUCT_VARIANTS_ROUTE` has a `__URL_KEY__` placeholder that the caller fills (the engine only resolves cookie-backed ones); its policy entry still matches the filled path.

### Cookie Consent

`app/_components/cookie-consent/`, mounted as `<CookieConsent />` in `app/layout.tsx`. No config: after hydration it
asks `GET /api/agreements/v2/__CHANNEL__/cookie-banner/` (django-agreements >= 2.2.0) through the API layer.

- **No banner on the backend (404, module absent) means nothing happens**: no library, no CSS, and the answer is
  cached for the session (`sessionStorage`), so the next pages do not ask again.
- **With a banner**, `consent-banner.ts` loads `vanilla-cookieconsent` and `cookie-consent.css` as a separate chunk.
  Every text comes from the backend; never put banner copy in the storefront.
- **Decisions** go to `POST .../cookie-consents/`. A 409 means a newer banner was published: refetch with
  `cache: "no-store"` and ask again.
- **Reopening the preferences**: any link whose `href` ends with `#cookie-consents` (a CMS footer, a static page).
  One delegated listener handles it; `app/globals.css` hides such links until a banner runs.
- **Tags**: the storefront ships none. `apply_consent()` in `consent-mode.ts` is the one place a tag learns about
  the decision (Consent Mode signals built from each category's `consent_mode`); a new tag adds its update there.
- **Theme**: the stylesheet sits in the cascade layer `cookie-consent` and reads the theme variables, and the
  buttons carry `data-variant` / `data-size` like `<Button>`, so a client theme reaches the banner unchanged.
- The library hides the banner from bots (`navigator.webdriver` included): a Playwright check has to override that.

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

## Theming / Styling

Tailwind CSS v4 with shadcn/ui ("new-york" style). Config in `components.json`.

- CSS variables enabled (`cssVariables: true`) — colors defined as HSL in `app/globals.css`
- Dark mode toggle in header — uses `class` strategy (Tailwind `dark:` prefix)
- Icons: `lucide-react`
- Utility: `cn()` from `lib/utils.ts` (clsx + tailwind-merge)
- Add shadcn components: `pnpm dlx shadcn add <component-name>`

## Config Variables

| File | Key | Purpose |
|------|-----|---------|
| `app.config.json` | `API_BASE_URL` | Backend URL (e.g. `http://localhost:8000`) |
| `app.config.json` | `DEBUG_MODE` | Enables `_LOGGER` console output and DEBUG-only dev tools |
| `channels.config.json` | `{channel}.CHANNEL_LABEL` | Channel display name |
| `channels.config.json` | `{channel}.API_CHECKOUT_KEY` | Checkout API key per channel (`x-api-key`) |
| `countries.config.json` | `{country}.default_language` | Default language for country |
| `countries.config.json` | `{country}.default_currency` | Default currency for country |
| `countries.config.json` | `{country}.default_channel` | Default channel for country |

## Testing

No test framework configured yet. When adding tests:

- Use Playwright for E2E (Next.js recommended)
- Use Vitest for unit tests
- Place E2E tests in `tests/e2e/`, unit tests co-located with source

## Gotchas

- `make_server_access()` is async (awaits `cookies()`); `make_client_access()` is sync.
- Pass one `api` instance per request to all loaders — splitting into multiple instances breaks `React.cache()` deduplication and causes duplicate fetches.
- `_CONFIG/` must exist before `pnpm dev`/`pnpm build` — JSON imports fail at build time if missing.
- `API_ROUTES_POLICY` drives default query params and auth headers per route. Adding a new route without a policy entry means no auth headers or language params are injected automatically.
- Filter prefix stripping (`q_`, `s_`, `r_`) happens in `page.tsx`, not in the store. The Zustand `filters.store.ts` initializes from `URLSearchParams` but does not strip prefixes — pages must parse before forwarding to API.
- `ch_key` (channel checkout key) is deliberately non-HttpOnly — client components read it from `document.cookie`. `at`/`rt`/`uid` are HttpOnly and set only by the auth Server Actions; never re-emit them in the middleware.

## Coding Standards

Priority order for React/Next.js code:
1. Eliminate waterfalls — `Promise.all()` for independent fetches, defer awaits
2. Bundle size — no barrel imports, `next/dynamic` for heavy components
3. Server-side performance — `React.cache()` deduplication, minimize client serialization
4. Re-render optimization — derive state during render, avoid unnecessary `memo`
