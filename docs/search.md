# Search feature

Header search with live results (phrases, categories, products) from the unified search endpoint: a magnifier that
spreads into a field on a desktop, a sheet on a phone. A results page (`/search?q=`) has every match on the catalog listing.

## Endpoint

```
GET /api/matrix/v2/{channel_idx}/search/?q=<text>&scope=products,categories&limit=6&page_size=6
Auth: optional (no token / x-api-key — matrix routes are public)
```

`limit` caps the categories only; the products follow `page_size` (default 12).

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
  - `to_price(product, currency)` — the lite price fields (including `range_from` of a configurable product) as a `Price`, rendered by `price_lines()` in the active language; base + optional struck-through special.
  - `product_href(product)` — a variant (no `url_key`) links to its parent's page with `?variant=<sku>`.
- **Overlay:** phone: shadcn `Sheet` `side="top"`. Desktop: the same Radix dialog, non-modal and without a portal, so it stays in the header, the page behind stays usable, and Radix still handles Escape, a click outside and the focus. Its results sit right under the top row and cover the menu row: the pointer on its way to them must not cross a menu trigger, which would open the megamenu over them. **Input:** `InputGroup`. **Live query:** 300ms debounce, gated `enabled: q.trim().length >= 2`, `placeholderData: (prev) => prev`.

## Files

| File | Role |
|---|---|
| `API/api.routes.ts` | `API_SEARCH_ROUTE` + policy (`default_querys: ["language","currency","country"]`) |
| `app/_components/layout/search.query.ts` | `search_query(api, {q, scope})` → **raw** `SearchResponse` |
| `app/_components/layout/header-search.client.tsx` | shared by both: `useHeaderSearch` (debounce + `useQuery`), the field, the states |
| `app/_components/layout/search-sheet.tsx` | phone: trigger + top `Sheet` |
| `app/_components/layout/search-bar.client.tsx` | desktop: magnifier + spreading field + results under the top row |
| `app/_components/layout/search-results.tsx` | phrases / categories / products sections |
| `app/_components/layout/search-product-row.tsx` | compact product row + **local** image/price mapping |
| `app/_components/layout/header-component.tsx` | mounts both in the action row (each shows at its width) and anchors the desktop results |
| `app/_components/not-found-search.client.tsx` | the same search inline on the 404 page |
| `app/[customer_country]/search/page.tsx` | results page: the catalog listing over `products/?search=` |

## Behavior

- Click the header's magnifier → an autofocused input opens: in a top sheet on a phone, spreading into the top row's free space on a desktop (the icons next to it stay put). Escape, a click outside or the close button closes it and clears the text.
- < 2 chars → "type at least 2 characters" hint. ≥ 2 chars → debounced fetch.
- Phrase click → refills input (re-runs). Category click → `/catalog/{url_key}`. Product click → `/product/{url_key}`, a variant → `/product/{parent_url_key}?variant={sku}` (closes sheet).
- Loading spinner in the input; error and empty states handled.
- Enter (≥ 2 chars) or "Show all results" under the products → `/search?q=<text>` (closes sheet). The 404 page's
  field does the same.

## Results page

`app/[customer_country]/search/page.tsx` renders the catalog's `ListingClient` (tiles, filter panel, sorting,
pagination, Omnibus lines) with `{ search: q, page, page_size, ...q_/s_/r_ }` instead of `{ category }`.

- **Source: `products/?search=`, not `search/`.** Same matches in the same order (relevance) as the sheet, but in
  the catalog shape, so `catalog_query` / `NORM_PRODUCTS_DATA` / `ProductTile` work unchanged; `q_`/`r_`/`s_` and
  `page`/`page_size` combine with it. It carries no `total`, so the heading names the phrase, not a count.
- **Filter counts:** `options/` takes no `search`, so its counts are the whole channel's. On the search page
  (`filters_query` with `options.search`) only the zeros are kept (no result can have that value); positive counts
  are hidden.
- `q` shorter than 2 chars → heading + "type at least 2 characters", no request. No match → "No results found."
  (no notify form: it asks about a category).
- Not indexed: `robots: { index: false }` and `search` in the robots.txt private paths. `search` is in
  `APP_ROUTES` (`utils/route-exists.ts`), so the proxy does not look it up as a CMS page.

## Follow-ups (not built)

- Filter counts for the results: needs `search` on `options/` (backend).
- Recent-searches history.
- Reconcile the lite product/category shape with the catalog shape (then the local mapping in `search-product-row.tsx` can be revisited).
