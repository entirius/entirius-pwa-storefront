# AGENTS.md -- entirius-pwa-storefront

## Quick Reference

Next.js 16 (App Router) e-commerce storefront for the Volkanos platform. React 19, TanStack Query v5, Zustand v5, Tailwind CSS v4, shadcn/ui. Consumes Matrix v2 (categories, products, prices, options, stock, search), Checkout v2 (carts, orders), Accounts v1 (customer, addresses) and ContentDB v1 (CMS pages).

## Commands

```bash
pnpm install           # Install dependencies
cp -r _CONFIG.example _CONFIG   # Required once — JSON config is imported by the code
pnpm dev               # Dev server (port 3100)
pnpm dev --port 3101   # Dev server on custom port
pnpm build             # Production build
pnpm lint              # ESLint
pnpm test:e2e          # Playwright E2E (needs a running backend, see Testing)
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

## Before Pushing

Agents never push, open PRs or merge — they hand the operator the exact commands. Before that,
review every outgoing commit (`git log origin/<branch>..HEAD`, full diff) against the Entirius
Handbook (entirius-docs, `handbook/`) and the maintainers' internal standards (location in the
local, untracked agent notes). Check at least:

- English-only code, comments, docs, commit messages and branch names.
- Git flow: `feature/<name>` from `develop`, lowercase, words separated by `-`.
- Committer identity matches the org (`git log --format='%an <%ae>' origin/<branch>..HEAD`).
- No AI attribution (see Commit Message Format).
- `gitleaks git --log-opts="origin/<branch>..HEAD" --redact` is clean with the canonical
  `.gitleaks.toml` — the history goes public, not just the final diff.
- `pnpm lint` does not grow, `pnpm build` and `pnpm test:e2e` are green.

Report the findings together with the push commands; a finding blocks the push until fixed.

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
# brand/               → identity assets (favicon, optional logo), named in app.config.json BRAND
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

Wrap loaders in `React.cache()` (see `api.query.ts` files). `cache()` keys on function identity + arguments, compared with `Object.is`. Two rules follow, and **both** are required:

1. Pass the **same** `api` instance to all loaders in a request — use `get_server_api()` (`lib/seo/server-api.ts`) rather than calling `create_api()` again. A second instance is a different reference and misses the cache.
2. The `cache()`d function must take **primitives**, never an options object. `Object.is({url_key:"x"}, {url_key:"x"})` is `false`, so a literal built at each call site misses every time — three call sites means three requests, even with a shared `api`.

The pattern: keep the cached function private and primitive-keyed, and export a wrapper that preserves the ergonomic options signature.

```ts
const _load_product = cache(async (api: Api, product_url_key: string) =>
  api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
    querys: { url_key: product_url_key, include: "full" },
  }),
);

export const load_product = (api: Api, options: { product_url_key: string }) =>
  _load_product(api, options.product_url_key);
```

For loaders whose options are open-ended (catalog filters, pagination), serialize with sorted keys — see `stable_key()` in `catalog/[catalog_url_key]/api.query.ts`.

A Server Component that has already awaited a response can skip the loader entirely: `product_query(api, options, response)` takes an optional third argument and feeds `PrefetchBoundary` directly.

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

- Colors, radii and fonts come from `@entirius/brand-tokens`. `app/globals.css` is the only file that maps `--brand-*` to semantic names (`background`, `card`, `primary`, `muted-foreground`, `positive`, `highlight`…).
- Components use semantic classes only. `pnpm lint` rejects hex, `rgb()`/`hsl()`/`oklch()` and Tailwind palette classes (`bg-red-500`, `text-white`) in `.ts`/`.tsx`.
- Dark only — no theme toggle; `<html class="dark">` is fixed.
- Icons: `lucide-react`
- Utility: `cn()` from `lib/utils.ts` (clsx + tailwind-merge)
- Add shadcn components: `pnpm dlx shadcn add <component-name>`

## Config Variables

| File | Key | Purpose |
|------|-----|---------|
| `app.config.json` | `API_BASE_URL` | Backend URL (template `http://localhost:8000`; the zeno local stack serves `:8100`) |
| `app.config.json` | `DEBUG_MODE` | Enables `_LOGGER` console output and DEBUG-only dev tools |
| `app.config.json` | `SITE_URL` | Public URL of the shop: canonical/Open Graph URLs, Playwright `baseURL` |
| `app.config.json` | `SITE_NAME` | Shop name: header wordmark (when no logo), page titles, Open Graph |
| `app.config.json` | `BRAND.LOGO` / `BRAND.LOGO_ALT` / `BRAND.FAVICON` | File names in `_CONFIG/brand/`, served by `app/brand/[file]` (only the listed names). `LOGO: null` shows the wordmark |
| `channels.config.json` | `{channel}.CHANNEL_LABEL` | Channel display name |
| `channels.config.json` | `{channel}.API_CHECKOUT_KEY` | Checkout API key per channel (`x-api-key`) |
| `countries.config.json` | `{country}.default_language` | Default language for country |
| `countries.config.json` | `{country}.default_currency` | Default currency for country |
| `countries.config.json` | `{country}.default_channel` | Default channel for country |

## Testing

E2E runs on Playwright (`playwright.config.ts`, specs in `tests/e2e/`). Unit tests are not set up yet — when added, use Vitest, co-located with source.

```bash
pnpm test:e2e              # headless; reuses a running `pnpm dev`, starts one otherwise
pnpm test:e2e --headed     # watch the browser
pnpm test:e2e --ui         # Playwright UI mode
```

- Uses the locally installed Google Chrome (`channel: "chrome"`) — no `playwright install` needed.
- `baseURL` is `SITE_URL` from `_CONFIG/app.config.json`.
- Tests hit a **live backend** with seeded data (the reference dataset of the `default-europe` channel). There are no API mocks; a missing or wrong backend fails every spec.
- Enter pages through the proxy (`page.goto("/catalog/...")`), never by setting country cookies by hand — the proxy is part of what is tested.
- A known gap is marked `test.fixme(...)` with the reason, not deleted.
- `checkout-guest.spec.ts` places a real order, and every order reserves stock for good. After ~50 runs the test product (`ENT-C001`) is out of stock and every spec that adds it to the cart fails with "Out of stock" — reseed the backend, then recreate the local test account.
- Failure screenshots and traces land in `test-results/` (gitignored); open a trace with `pnpm exec playwright show-trace <path>`.
- `visual.spec.ts` compares home, catalog, PDP and cart with baselines in `tests/e2e/visual.spec.ts-snapshots/` (per OS, product photos masked). After an intended visual change: `pnpm test:e2e visual --update-snapshots=all`, then review the new PNGs in the diff. `contrast.spec.ts` checks WCAG AA of the semantic color pairs.

## Gotchas

- `make_server_access()` is async (awaits `cookies()`); `make_client_access()` is sync.
- Pass one `api` instance per request to all loaders — splitting into multiple instances breaks `React.cache()` deduplication and causes duplicate fetches.
- Never give a `cache()`d loader an object argument. `cache()` compares arguments by reference, so `load_x(api, { url_key })` written at three call sites is three cache misses and three network calls — the shared `api` instance does not save you. Key on primitives; see React.cache() Deduplication above.
- `_CONFIG/` must exist before `pnpm dev`/`pnpm build` — JSON imports fail at build time if missing.
- Restart `pnpm dev` after adding a package that is an optional peer of `next` (e.g. `@playwright/test`). pnpm reinstalls `next` under a new `.pnpm/` path, and the running server then fails with `Cannot find module …/next/dist/compiled/jest-worker/processChild.js` and answers 500.
- `API_ROUTES_POLICY` drives default query params and auth headers per route. Adding a new route without a policy entry means no auth headers or language params are injected automatically.
- Filter prefix stripping (`q_`, `s_`, `r_`) happens in `page.tsx`, not in the store. The Zustand `filters.store.ts` initializes from `URLSearchParams` but does not strip prefixes — pages must parse before forwarding to API.
- `ch_key` (channel checkout key) is deliberately non-HttpOnly — client components read it from `document.cookie`. `at`/`rt`/`uid` are HttpOnly and set only by the auth Server Actions; never re-emit them in the middleware.

## Coding Standards

Priority order for React/Next.js code:
1. Eliminate waterfalls — `Promise.all()` for independent fetches, defer awaits
2. Bundle size — no barrel imports, `next/dynamic` for heavy components
3. Server-side performance — `React.cache()` deduplication, minimize client serialization
4. Re-render optimization — derive state during render, avoid unnecessary `memo`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
