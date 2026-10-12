# AGENTS.md

`entirius-pwa-storefront` — the storefront of Entirius: a Next.js (App Router) app with React, TanStack Query,
Zustand, Tailwind CSS and shadcn/ui. It consumes the backend's Matrix v2 (categories, products, prices, options,
stock, search), Checkout v2 (carts, orders), Accounts v1 (customer, addresses) and ContentDB v1 (CMS pages) APIs.

## Commands

| Command | Meaning |
|---|---|
| `pnpm install` | install dependencies |
| `cp -r _CONFIG.example _CONFIG` | required once: the code imports the JSON config |
| `pnpm dev` | dev server (port 3000); `pnpm dev --port 3001` for another port |
| `pnpm build` | production build |
| `pnpm start` | serve the production build |
| `pnpm lint` | ESLint |

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
- Testing: no test framework yet; `pnpm lint` is the check.

### Commit Message Format

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

| Topic | Where |
|---|---|
| File map, key patterns (API layer, `PrefetchBoundary`, `React.cache()`, filter URLs), data flow, geo routing, components, state, styling, coding standards | `docs/architecture.md` |
| `_CONFIG/` files and every config key | `docs/configuration.md` |
| Header search: endpoint, the lite result shape, files, behavior | `docs/search.md` |

## Gotchas

- `make_server_access()` is async (awaits `cookies()`); `make_client_access()` is sync.
- Pass one `api` instance per request to all loaders — splitting into multiple instances breaks `React.cache()` deduplication and causes duplicate fetches.
- `_CONFIG/` must exist before `pnpm dev`/`pnpm build` — JSON imports fail at build time if missing.
- `API_ROUTES_POLICY` drives default query params and auth headers per route. Adding a new route without a policy entry means no auth headers or language params are injected automatically.
- Filter prefix stripping (`q_`, `s_`, `r_`) happens in `page.tsx`, not in the store. The Zustand `filters.store.ts` initializes from `URLSearchParams` but does not strip prefixes — pages must parse before forwarding to API.
- `ch_key` (channel checkout key) is deliberately non-HttpOnly — client components read it from `document.cookie`. `at`/`rt`/`uid` are HttpOnly and set only by the auth Server Actions; never re-emit them in the middleware.
