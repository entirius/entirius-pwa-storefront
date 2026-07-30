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
- No AI attribution: never add a `Co-Authored-By: Claude ...` trailer or a "Generated with Claude Code"
  footer — commits and PR descriptions carry only the developer's content.
- Component files: `kebab-case.tsx`; client components must have `.client.tsx` suffix.
- Co-locate query definitions (`api.query.ts`) with the page that owns them.
- Normalizers live in `utils/NORMALIZERS/` — keep raw API shapes out of components.
- No barrel imports (`index.ts`) — import directly to keep bundle splitting intact.
- Use `next/dynamic` for heavy client components (carousels, sheets, modals).
- `@/` maps to repo root: `@/API/`, `@/_CONFIG/`, `@/components/`, `@/lib/`, `@/utils/`.
- API paths are a backend contract — never rewrite route constants or placeholders ad hoc.

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
│   ├── auth-client.ts            # Login/signup/activate/logout against Accounts
│   ├── prefetch_boundary.tsx     # Server-side TanStack Query prefetch + hydration
│   ├── link-dynamic.tsx          # Dynamic import wrapper
│   ├── logger.ts                 # _LOGGER (respects DEBUG_MODE from config)
│   └── utils.ts                  # cn() utility
├── providers/
│   ├── auth.provider.tsx         # Per-request logged-in flag (seeded server-side)
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
```

Import configs directly: `import countries from "@/_CONFIG/countries.config.json"`. Config is type-checked at build time.

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
