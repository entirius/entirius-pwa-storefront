# Patterns and gotchas

How data is fetched, cached and hydrated, and the traps that cost time before.

## API Layer

Returns `[error, data, meta]` tuples — always destructure, never throw on API errors.

```ts
const api = create_api(await make_server_access()); // RSC/Server Action
const api = create_api(make_client_access());        // Client Component

const [error, data] = await api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
  querys: { category_url_key: 'shoes', page: 1 }  // auto-converted to query string
});
```

Route placeholders `__CHANNEL__`, `__USER_ID__`, `__CART_ID__` are resolved from cookies via the access adapter. Never call `fetch()` directly — always use `FETCH_METHOD`.

## PrefetchBoundary

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

## React.cache() Deduplication

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

## Filter URL Convention

Search params use prefixes parsed in `page.tsx` before passing to `PrefetchBoundary`:
- `q_color=red` → filter value
- `s_price=asc` → sort
- `r_price=10&r_price=500` → range

The catalog page's `build_params()` helper strips prefixes before forwarding to the API.

## Gotchas

- `make_server_access()` is async (awaits `cookies()`); `make_client_access()` is sync.
- Pass one `api` instance per request to all loaders — splitting into multiple instances breaks `React.cache()` deduplication and causes duplicate fetches.
- Never give a `cache()`d loader an object argument. `cache()` compares arguments by reference, so `load_x(api, { url_key })` written at three call sites is three cache misses and three network calls — the shared `api` instance does not save you. Key on primitives; see React.cache() Deduplication above.
- `_CONFIG/` must exist before `pnpm dev`/`pnpm build` — JSON imports fail at build time if missing.
- Restart `pnpm dev` after adding a package that is an optional peer of `next` (e.g. `@playwright/test`). pnpm reinstalls `next` under a new `.pnpm/` path, and the running server then fails with `Cannot find module …/next/dist/compiled/jest-worker/processChild.js` and answers 500.
- `API_ROUTES_POLICY` drives default query params and auth headers per route. Adding a new route without a policy entry means no auth headers or language params are injected automatically.
- Filter prefix stripping (`q_`, `s_`, `r_`) happens in `page.tsx`, not in the store. The Zustand `filters.store.ts` initializes from `URLSearchParams` but does not strip prefixes — pages must parse before forwarding to API.
- `ch_key` (channel checkout key) is deliberately non-HttpOnly — client components read it from `document.cookie`. `at`/`rt`/`uid` are HttpOnly and set only by the auth Server Actions; never re-emit them in the middleware.
