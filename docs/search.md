# Search feature

Header-triggered search modal with live results (phrases, categories, products) from the unified search endpoint.

## Endpoint

```
GET /api/matrix/v2/{channel_idx}/search/?q=<text>&scope=products,categories&limit=6
Auth: optional (no token / x-api-key — matrix routes are public)
```

`language` / `currency` / `country` are auto-injected by the fetch engine (route policy `default_querys`).

Response:
```
{
  products:   { total, results[], has_next_page },
  categories: { results[] },
  phrases:    [ { text, type } ],   // type e.g. "completion"
  meta
}
```

## ⚠️ Search results are a "lite" shape (diverges from catalog `products/`)

The search product/category items are **not** the same shape as the catalog endpoints, so the shared catalog normalizers (`NORM_PRODUCTS_DATA`, `ProductTile`) are **deliberately not reused**. The divergence is contained inside the search components (local mapping), pending a backend/shape reconciliation.

| Field | catalog `products/` | search `search/` |
|---|---|---|
| price | nested `{ gross, currency, final_gross, has_special_price, … }` | flat number `price` + siblings `gross`, `final_gross`, `special_gross`, `has_special_price`, `percent_off`, `promo_badge` |
| image | `media: [{ source_set:[…] }]` (array) | `main_image`: **stringified JSON** of one media object (has `source_set`), or `null` |
| currency | on the price object | absent — read from the `cr` cookie client-side |

Category item: `{ idx, name, url_key, image_url, products_count }` (vs catalog `{ id, url_key, name, has_children }`).

## Design

- **No shared normalizer, no shared-flow coupling.** `search_query`'s `queryFn` returns the **raw** response. No `NORM_*` reuse, no `seed`/`["product", url_key]` cache warming.
- **Local mapping** lives in `search-product-row.tsx`:
  - `resolve_image(main_image)` — `try/catch JSON.parse`, picks a ~320px `source_set` thumb, falls back to `image_placeholder`.
  - `format_price({ gross, final_gross, has_special_price }, currency)` — base + optional struck-through special.
- **Overlay:** shadcn `Sheet` `side="top"` (the only overlay primitive available). **Input:** `InputGroup`. **Live query:** 300ms debounce, gated `enabled: q.trim().length >= 2`, `placeholderData: (prev) => prev`.

## Files

| File | Role |
|---|---|
| `API/api.routes.ts` | `API_SEARCH_ROUTE` + policy (`default_querys: ["language","currency","country"]`) |
| `app/_components/layout/search.query.ts` | `search_query(api, {q, scope})` → **raw** `SearchResponse` |
| `app/_components/layout/search-sheet.tsx` | trigger + top `Sheet` + debounce + `useQuery` + states |
| `app/_components/layout/search-results.tsx` | phrases / categories / products sections |
| `app/_components/layout/search-product-row.tsx` | compact product row + **local** image/price mapping |
| `app/_components/layout/header-component.tsx` | mounts `<SearchSheet/>` in the action row |

## Behavior

- Click header search icon → top sheet opens with an autofocused input.
- < 2 chars → "type at least 2 characters" hint. ≥ 2 chars → debounced fetch.
- Phrase click → refills input (re-runs). Category click → `/catalog/{url_key}`. Product click → `/product/{url_key}` (closes sheet).
- Loading spinner in the input; error and empty states handled.

## Follow-ups (not built)

- Dedicated `/search?q=` results page with pagination (`has_next_page`) + `q_`/`r_` filter panel (endpoint already supports `page`/`page_size`/`sort`/`q_`/`r_`).
- Recent-searches history.
- Reconcile the lite product/category shape with the catalog shape (then the local mapping in `search-product-row.tsx` can be revisited).
