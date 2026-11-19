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

## Shape: products of `search/` are items of `products/`

Since matrix 5.0 the products of `search/` come through the same serializer as `products/`: nested `price` object
with `currency`, `main_image` as a media object, `badges` as `{ idx, name }`, `categories`. `search_query` runs them
through `NORM_PRODUCTS_DATA` (`NORM_SEARCH_DATA`), so the row reads the same `Product` as the catalog tile. There is no
search-only product type or mapping. This storefront needs matrix 5.0 or later: on 4.x the header search shows no prices.

Category item: `{ idx, name, url_key, image_url, products_count }` (vs catalog `{ id, url_key, name, has_children }`);
categories and phrases stay as the API sends them.

## Design

- **Normalized like the catalog.** `search_query`'s `queryFn` returns `NORM_SEARCH_DATA(response)`: products through
  `NORM_PRODUCTS_DATA`, no `seed`/`["product", url_key]` cache warming.
- **The row** (`search-product-row.tsx`) shows the catalog's `ProductPrice` (compact: base + struck-through special,
  Omnibus line, "From" for a configurable product, in the active language), a thumb of `media[0]` (~320px source, else
  the first, else the placeholder) and the name. `product_href(product)`: a variant (no `url_key`) links to its parent's
  page with `?variant=<sku>`.
- **Overlay:** phone: shadcn `Sheet` `side="top"`. Desktop: the same Radix dialog, non-modal and without a portal, so it stays in the header, the page behind stays usable, and Radix still handles Escape, a click outside and the focus. Its results sit right under the top row and cover the menu row: the pointer on its way to them must not cross a menu trigger, which would open the megamenu over them. **Input:** `InputGroup`. **Live query:** 300ms debounce, gated `enabled: q.trim().length >= 2`, `placeholderData: (prev) => prev`.

## Files

| File | Role |
|---|---|
| `API/api.routes.ts` | `API_SEARCH_ROUTE` + policy (`default_querys: ["language","currency","country"]`) |
| `lib/search/search.query.ts` | `search_query(api, {q, scope})` → `SearchResponse` (`NORM_SEARCH_DATA`, each product with its `href`) |
| `lib/layout/use-header-search.ts` | `useHeaderSearch` (debounce + `useQuery`), lent to the theme through `Storefront` |
| `@theme/layout/search-field` | shared by both: the field and the states |
| `@theme/layout/search-sheet` | phone: trigger + top `Sheet` |
| `@theme/layout/search-bar` | desktop: magnifier + spreading field + results under the top row |
| `@theme/layout/search-results` | phrases / categories / products sections |
| `@theme/layout/search-product-row` | compact product row with `ProductPrice` and `ProductThumb` |
| `@theme/layout/header` | mounts both in the action row (each shows at its width) and anchors the desktop results |
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

`app/[customer_country]/search/page.tsx` renders the catalog's listing (`ListingPageRuntime` with the theme's
`@theme/catalog/listing-page`: tiles, filter panel, sorting, pagination, Omnibus lines) with
`{ search: q, page, page_size, ...q_/s_/r_ }` instead of `{ category }`.

- **Source: `products/?search=`, not `search/`.** Same matches in the same order (relevance) as the sheet, but in
  the catalog shape, so `catalog_query` / `NORM_PRODUCTS_DATA` / `ProductCard` work unchanged; `q_`/`r_`/`s_` and
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
- Reconcile the category shape with the catalog's.
