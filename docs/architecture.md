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
│   ├── layout.tsx                # Root layout (providers, language, layout slots, cookie banner)
│   ├── _components/layout-slots/ # CMS content on every page (announcement, before-footer)
│   ├── _components/cookie-consent/ # Cookie banner on django-agreements
│   └── [customer_country]/       # All routed pages live under the country segment
│       ├── (builder)/[[...slug]] # CMS/builder pages (catch-all)
│       ├── blog/                 # Blog: list, [slug] post, authors/[slug] author (contentdb `blog-post`)
│       ├── (catalog)/catalog/[catalog_url_key]/  # Listing page
│       ├── (product)/product/[product_url_key]/  # PDP
│       ├── checkout/             # Address → shipping → payment → review stepper
│       ├── profile/              # Account: profile, addresses, orders
│       ├── reset-password/       # Landing of the password reset mail (new password from ?key=)
│       └── user-handler/         # Double-opt-in activation landing
├── components/                   # The forms' logic (login, register, contact forms, stock alert); their views are @theme/forms/*
├── packages/
│   ├── sdk/                      # @entirius/storefront-sdk: messages (src/i18n/messages/en.ts, pl.ts), t(), price(), useI18n()
│   └── theme-default/            # @entirius/theme-default: shadcn/ui primitives (src/ui/), imported as @theme/ui/<name>
├── lib/
│   ├── i18n/                     # Language resolution, _CONFIG overrides, server loader, price_lines()
│   ├── auth-client.ts            # Login/signup/activate/password/logout against Accounts
│   ├── prefetch_boundary.tsx     # Server-side TanStack Query prefetch + hydration
│   ├── link-dynamic.tsx          # Dynamic import wrapper
│   ├── logger.ts                 # _LOGGER (respects DEBUG_MODE from config)
│   └── utils.ts                  # cn() utility
├── providers/
│   ├── auth.provider.tsx         # Per-request logged-in flag (seeded server-side)
│   └── Tanstack-query.provider.tsx
├── stores/                       # Zustand cart + wishlist, cart query & sync hook, wishlist account sync
├── utils/
│   ├── NORMALIZERS/              # Data transformation (product, price, media, cart, order)
│   ├── validation/               # Zod schemas (auth, address, customer address)
│   └── cookies-setter.helper.ts  # Geo/Cloudflare cookie resolution (proxy.ts)
├── types/                        # Shared TypeScript types
├── proxy.ts                      # Next.js middleware — geo routing + cookie injection
└── _CONFIG.example/              # Committed config templates (copy to _CONFIG/)
    ├── app.config.json           # API_BASE_URL, DEBUG_MODE, COLOR_SCHEME, SITE_NAME, BRAND
    ├── channels.config.json      # Channel labels + checkout keys
    ├── countries.config.json     # Country → language/currency/channel mapping
    ├── theme.css                 # Client theme (empty = default look)
    └── fonts.ts                  # Typefaces, loaded through next/font
```

## File Map

| File | Purpose |
|------|---------|
| `API/api.routes.ts` | All route URL constants + `API_ROUTES_POLICY` (default query params, headers, token refresh per route) |
| `API/api.setup.ts` | `create_fetch_engine(access)` — session placeholder resolution, the call's `suffix` segments, query string, auth headers, 401 refresh |
| `API/api.context.ts` | `create_api(cookie_access)` — maps cookie keys to access methods, returns `{ FETCH_METHOD }` |
| `proxy.ts` | Middleware: reads `ct` cookie or `cf-ipcountry`, rewrites URL to `/{country}/...`, sets the profile and channel cookies, and the Content-Security-Policy with a per-request nonce (`lib/csp.ts`) |
| `app/robots.ts`, `app/sitemap.ts` | `/robots.txt` (private flows and filter URLs disallowed, sitemap named by `SITE_URL`) and `/sitemap.xml` (CMS pages, categories, products incl. sold out, the blog with its posts and authors, read from the API at request time; every profile in its own language with hreflang alternates, each address in its canonical form, `/catalog/x` for the `default` profile, pure helpers in `lib/seo/sitemap.ts`). Dotted paths are outside the `proxy.ts` matcher |
| `app/og-image.png/route.tsx` | Default share image when `BRAND.OG_IMAGE` is not set: the shop name on the theme background (`lib/share-image.ts` reads the brand tokens), prerendered at build. A route handler, not the `opengraph-image` file convention: a page that sets its own `openGraph` replaces the parent's whole, so `DEFAULT_OG_IMAGES` in `lib/brand.ts` hands the address to every page. The home page carries JSON-LD `Organization` (`SITE_NAME`, `SITE_URL`, `BRAND.LOGO`) |
| `lib/prefetch_boundary.tsx` | `PrefetchBoundary` — server prefetches TanStack queries, dehydrates, wraps children in `HydrationBoundary` |
| `lib/auth-client.ts` | Client-side auth flows: login, signup, double-opt-in activation, password reset and change, logout |
| `app/[customer_country]/.../{page}/api.query.ts` | Co-located query definitions (`queryKey`, `queryFn`) + `cache()`-wrapped loaders |
| `stores/cart.store.ts` | Zustand cart (flat localStorage serialization) |
| `stores/use-cart-sync.ts` | Shared create-or-patch cart sync (cart page + checkout dedupe to one backend call) |
| `stores/wishlist.store.ts` | Zustand wishlist with flat localStorage serialization (key `WL`) |
| `stores/wishlist-sync.ts` | Signed in, the wishlist lives on the account (accounts `wishlist/`, SKUs only): the heart writes there too, a page load takes the account's list, sign-in adds the guest's list to it, sign-out clears the device's; product snapshots come from `products/?sku=` |
| `utils/NORMALIZERS/` | `NORM_PRODUCTS_DATA`, `NORM_FILTERS_DATA`, `NORM_MEDIA_DATA`, cart/order/price normalizers |

## Configuration

`_CONFIG/` files and every key: [configuration](configuration.md).

## Data Flow

```
proxy.ts (middleware)
  → reads ct cookie / cf-ipcountry header
  → rewrites URL to /{country}/...
  → sets lg, cr, ch, ch_key, cf_key, nl_key, ag_key, sa_key, cid cookies (at/rt/uid belong to app/session/)
  → sets the Content-Security-Policy with a fresh nonce on the request (Next.js puts it on its scripts) and the response

page.tsx (Server Component)
  → make_server_access() reads next/headers cookies
  → create_api(access) wires cookie values into fetch engine
  → PrefetchBoundary runs queryFn server-side, dehydrates result

HydrationBoundary (client)
  → rehydrates TanStack Query cache
  → useQuery() reads cache — no refetch on mount
```

## Session and Content-Security-Policy

- Login, the token refresh and logout go through the storefront's route handlers `app/session/login`, `refresh` and
  `logout` (`lib/session.ts`), outside `/api` and outside the proxy. They keep the tokens as cookies: `rt` HttpOnly,
  `at` and `uid` readable, since the browser calls the API itself with `Authorization`. On a 401 the client engine
  (`API/api.setup.ts`) asks `/session/refresh`, which refreshes with the HttpOnly token; a token accounts refuses ends
  the session, a backend that does not answer leaves it as it is. Logout runs inside `end_session()` of the engine: the
  requests in flight are cancelled and no refresh starts until it ends, since one that 401s mid-logout would refresh
  with the token not yet cleared and sign the customer back in. `/session/logout` revokes the refresh token in
  accounts (`customer/tokens/blacklist/`, with the access token, renewed first when expired) before it clears the
  cookies, so a refresh that left earlier, or a copy of the cookie, is refused; the cookies go whatever accounts
  answers. Route handlers, not Server Actions: a cookie written by a Server Action makes the router refetch the whole
  route.
- `proxy.ts` sends every page with an enforced Content-Security-Policy (`lib/csp.ts`): scripts need the request's nonce
  ('strict-dynamic' lets the framework's own scripts load their chunks), styles keep 'unsafe-inline' (Radix and `style`
  attributes), and the API origin is allowed for data and media. Every HTML route renders per request, as a nonce
  needs; in production the not-found page relays the policy of its own render. A deployment adds sources per
  directive in `CSP` of `app.config.json` (analytics, a payment widget, a CDN).

## Geo Routing

All pages live under `app/[customer_country]/`. The `ct` cookie (set by middleware from `cf-ipcountry` or existing cookie) determines the country segment. `countries.config.json` lists valid country keys. Unknown countries fall through to `default`.

## Component Organization

| Tier | Location | Purpose |
|------|----------|---------|
| Theme | `packages/theme-default/src/ui/` | Base primitives (Button, Input, Sheet, Carousel), imported as `@theme/ui/<name>`. Added via shadcn, see [styling](styling.md) |
| Theme components | `packages/theme-default/src/components/`, `src/product/` | Product card, price, badges, wishlist button; the product page and its parts. `@theme/components/<name>`, `@theme/product/<part>` |
| Account | `packages/theme-default/src/account/` (look), `app/[customer_country]/profile/**/_components/*-runtime.client.tsx`, `lib/account-models.ts` | The account section's pages and parts: `@theme/account/<part>` |
| CMS and blog | `packages/theme-default/src/cms/`, `src/blog/` (look), `(builder)/[[...slug]]/_components/` (renderer, data), `lib/cms/`, `lib/blog-models.ts` | Server parts: a block type of the CMS editor per file (`@theme/cms/<type>`), the blog's pages and parts (`@theme/blog/<part>`) |
| Forms | `components/*-form.client.tsx` and the forms next to their pages (logic), `packages/theme-default/src/forms/` (views) | Validation, sending and state in the core; fields and layout in `@theme/forms/<name>` |
| Shared | `lib/` | Cross-page components (PrefetchBoundary, LinkDynamic); `lib/storefront/` fills the SDK's `Storefront` |
| Layout | `packages/theme-default/src/layout/` (look), `lib/layout/` (data, menu queries, hooks) | Header, footer, menus, search, account, cart link, wishlist sheet, locale switch, notices: `@theme/layout/<part>` |
| Page feature | `app/[customer_country]/.../_components/` | Co-located with owning page (filters, product tile, listing) |

Client components use `.client.tsx` suffix. Server components have no suffix.

### Themes

For a theme author and a shop builder: [building a theme](themes/guide.md), [building a shop](themes/shop.md), [the
contract](themes/contract.md). This section is the core's side.

`@theme/<path>` resolves through `tsconfig.json` paths: `theme/src/<path>` when an installed theme has that file,
else `packages/theme-default/src/<path>`. A theme overrides a component by shipping a file at the same path with the
same exports; everything else comes from the default theme. Components inside the default theme import each other
through `@theme/*` too, so an override reaches them (a theme's `Button` is the one in the default `QuantityStepper`).
`theme/` is gitignored: a shop build or the theme's dev server puts it there. `app/globals.css` has `@source "../theme"`
for its classes.

A theme's colours and shapes are `@theme/tokens.css`: the root layout loads `app/globals.css`, then this file, then the
shop's `_CONFIG/theme.css`, so a theme overrides the default look and a shop overrides the theme. It sets the semantic
variables of `app/globals.css` (`--primary`, `--surface-radius`, `--product-image-ratio`, `--catalog-columns`...); the
default theme's file is empty. Typefaces stay in `_CONFIG/fonts.ts` (`next/font`).

A theme never imports the core. What it needs from it comes through `@entirius/storefront-sdk`:

- **Types** of what it renders (`/product`, `/product/card`): the shapes the normalizers produce, not raw API data.
- **`Storefront`** (`/storefront`): hooks and settings the core lends at run time (`useWishlist`, `useProductCard`,
  `useQuickAdd`, `useOmnibus`, the picture origin, the localized link). `lib/storefront/storefront.client.tsx` fills
  it once in the root layout; SDK components use it (`Media`, `Link`; `RichText` sanitizes on its own).
- **A page model** per page (`/product/page`): the core works out the page (data, real-time stock, buy rules,
  actions) in `ProductPageRuntime`, and every part of the template reads it with `useProductPage()`. The listing
  (`/catalog/listing`, a category or a search) the same way: `ListingPageRuntime`, `useListingPage()`; the filter
  panel's hooks (`useListingFilters`, `useFilterOption`, `useSortCriterion`, `useRangeFilter`, `useAppliedFilters`)
  come with it, each following only its own piece of the panel's state, so a click re-renders one checkbox. The
  cart (`/cart/page`): `CartPageRuntime`, `useCartPage()`.

A page template is an arrangement of named parts: `@theme/product/product-page` puts `gallery`, `header`, `price`,
`stock-status`, `variant-picker`, `buy-box`, `description`, `specs`, `stories`, `related` and `sticky-buy-bar` in
place. Since a part reads the model itself, a theme replaces one part, the arrangement, or both. Forms with logic of
their own (enquiry, back-in-stock, notify about a similar product) come from the core whole, in `blocks`. The
listing's template `@theme/catalog/listing-page` arranges `listing-header`, `filters` (with `sort-options`,
`filter-range`, `filter-options`), `filters-sheet`, `pagination`, `product-grid` and `listing-empty`, for the category
and the search page alike. The cart's `@theme/cart/cart-page` arranges `cart-line`, `cart-summary` and `cart-bar` with
the order parts it shares with checkout (`@theme/order/page-header`, `order-steps`, `unit-price`, `summary-card`,
`order-totals`); the core hands them models through thin adapters (`order_steps()`, `unit_price()`,
`order_totals()`), and so do the cart's problems (`@theme/order/cart-alerts`, `cart_alerts()`) and its gifts
(`@theme/cart/gift-line`, `gift-picker`, `@theme/checkout/summary-gift-line`: `gift_line()` and `gift_picker()` in
`app/_components/order/cart-gifts.ts`, the rules and the gift setter stay in the core). The discount code comes whole
in `blocks`. Checkout (`/checkout`)
keeps its steps, forms, delivery, payment and the order button in the core, none of them overridable (a theme must
not be able to break an order); a theme draws the page header, the steps, the summary beside them
(`@theme/checkout/checkout-summary` with `summary-line`, its model built by `useCheckoutSummary()`) and the page
after the order (`@theme/checkout/success-page` with `order-receipt`, keeping `data-order-receipt` and
`data-print-hide` for the print styles), and the form primitives (`@theme/ui/*`) the core's forms use. The shop's
other forms (signing in, a new account, the reset mail and the new password, the profile, the password, the address
sheet, the newsletter, an enquiry, notify about a similar product, back in stock, the discount code) keep their
validation, sending and state in the core and draw a view of the theme, `@theme/forms/<name>`, from a model in
props (`/forms`): a react-hook-form form hands the view `form`, `submit` and `pending`, so its fields bind to
`form.control` through `TextField` / `SelectField` / `CheckboxField`; a contact form hands its state, `submit` (the
core reads the fields by `name`) and the consent (`TokenLinks` from the SDK draws its privacy link); where the core draws a part of a form itself (the register form's consent boxes, `consents`, like the login form's `dev_tools`), the model carries it as a node. The forms keep
their names and props in the core, so `Storefront.forms` still loads the account ones on first use. The account (`/account/page`): the
section's frame `@theme/account/account-layout` with `account-menu` (`useAccountMenu()`, set in the profile layout,
which also guards the section), `overview-page`, `orders-page`, `order-page` and `addresses-page`, each with its
runtime in the core (`OverviewRuntime`, `OrdersRuntime`, `OrderRuntime`, `AddressesRuntime`) and the models of
`lib/account-models.ts`: prices, dates and an order's status as a label and a tone (`notice`, `positive`,
`negative`, `informative`, `neutral`) the theme colours. The forms (profile, password, address sheet, the new
password) come whole from the core. The pages answering an e-mail link (activation, password reset, newsletter,
back in stock) draw `@theme/components/message-page` in props, the reset form `@theme/account/reset-password-page`.
Files in `packages/` carry no `.client` suffix: the path is the contract.

Those parts are browser parts: they read a context. CMS content and the blog are server parts instead: plain HTML
with their data in props, as content needs no browser JS:

- **A CMS block** (a section or a tile of the page editor) is `@theme/cms/<core_type>`: `section-text`,
  `section-hero-slider`, `tile-hero`... (`section-product-slider` serves both product sections). `CmsDocument`
  (`(builder)/[[...slug]]/_components/cms-document.tsx`) reads what the document's blocks show on the server first
  (`load_cms_data`: button addresses in the active language's url keys, products by url key, by SKU and of a
  category, the posts of blog sections, all batched and cached per request), then `cms_blocks` in `cms-renderer.tsx`
  turns each block into its part's props, typed in the SDK (`/cms`): text fields, `links` (`CmsLink`: address,
  external, look), `pictures` (`CmsPictures`), products (`ProductCardData`) and `t`. The same renderer draws CMS
  pages, layout slots, the blog's intro and a post's body. The parts that need the browser are client components
  inside: `hero-carousel`, `product-rail`, the product card, the accordion; a form the core owns (the enquiry form
  inside `section-type-a`) comes in a prop. The JS of a CMS page is its route's whatever the content: the sections,
  their queries and API calls are not in it.
- **The blog** (`/blog`, a post, an author) is `@theme/blog/blog-page`, `post-page` and `author-page` with their
  parts (`post-tile`, `post-grid`, `category-tabs`, `pagination`, `post-header`, `post-toc`, `post-authors`,
  `post-neighbours`, `author-photo`). The core reads the posts and hands over view models (`/blog`, built in
  `lib/blog-models.ts`): addresses, dates and author lists already in the page language; a post's body and the
  list's intro come rendered.
- A server part gets `t` as a prop; a function cannot reach the browser, so a client component inside one reads its
  words with `useI18n()`. A theme must not make a server part a client component (`t` would fail to serialize).

The core also ships as three images (`docker/storefront.Dockerfile`, no configuration or data inside; `.dockerignore`
is an allowlist):

- `storefront-builder` (`--target builder`): the source with its production dependencies (what `next build` needs,
  `pnpm install --prod`: the test and lint tools stay out) and the `storefront` command
  (`docker/storefront-entrypoint.sh`), where a shop is built. A shop is a folder with a two-stage `Dockerfile`
  (`FROM storefront-builder:<version> AS build`, `COPY _CONFIG /app/_CONFIG`, `RUN storefront build
  @acme/theme@1.3.0`, then `FROM storefront-runtime:<version>`, `COPY --from=build /app/out /app`), its `_CONFIG` and
  a build secret `.npmrc` for a private theme registry: `storefront build` installs the theme package's `src/` at
  `/app/theme`, runs `next build` with `STOREFRONT_OUTPUT=standalone` (Next's standalone server, `next.config.ts`) and
  puts the server, `.next/static`, `public/` and `_CONFIG` (read at run time: messages, brand files) in `/app/out`.
  The shop's image holds its configuration and keys: it is never public. Going back is running the previous image.
- `storefront-runtime` (`--target runtime`): `node:24-slim` and the `storefront` command; `storefront start` runs the
  standalone server on :3000 (`/app/server.js`, or `/app/out/server.js` in a single-stage image).
- `storefront-dev` (`--target dev`): the same core running `storefront dev`, `next dev` on :3100 with a theme mounted
  at `/app/theme` and a configuration at `/app/_CONFIG` (else `_CONFIG.example`).

In `dev` and `start` an `API_BASE_URL` on `http://localhost:<port>` is forwarded to the host, so the browser and the
server use one address. `next build` asks the API for nothing (the static routes are the manifest, the share image
and `robots.txt`), so a shop's image builds without its backend.

The page shell works the same way. `LayoutRuntime` (`lib/layout/`, in the root layout) works out on the server what
the header and footer need (logo, menu types and whether the megamenu fits the logo's row, the visitor's languages and
currencies, the CMS footer), prefetches the menu's top level and hands it over as `useLayout()`. The theme's
`@theme/layout/header` and `footer` and their parts read it, and take the rest from `Storefront` hooks (menu branches,
header search, account, cart count, wishlist sheet, notices, locale switch). Account forms load on first use through
`Storefront.forms`; signing in to the account's wishlist runs in the core (`WishlistAccountSync`), whatever the theme
shows. `@theme/layout/page-shell` arranges the frame around every page (the layout slots, the header, `main`, the
footer); the root layout reads the slots' CMS pages and hands them over rendered, or null. The 404 page is
`@theme/layout/not-found-page` (the menu's top categories from the core) with `not-found-search`, the header's
search hook inline.

`docker/verdaccio/compose.yaml` runs a local npm registry on :4873 to publish `@entirius/*` before anything is public.
`docker/try-themes.sh` does all of it from a checkout: the registry, the three images and the four packages at their
version, then prints the theme author's commands.

A theme author never clones this repository. `pnpm create @entirius/theme <name>` (`packages/create-theme`, `--example`
for a theme with a look of its own: `tokens.css` and a product card) writes a theme folder: `package.json` with the SDK, the default theme and `@entirius/theme-cli`, a `tsconfig.json` that resolves
`@theme/*` like the core (`src/` first, then the default theme), `theme.json`, an empty `src/`. The `entirius` command
(`packages/theme-cli`) then runs in it:

- `dev`: the `storefront-dev` image of the installed SDK's version with `src/` mounted at `/app/theme/src` (only
  `src/`: the theme's `node_modules` would bring a second React and SDK) and `_CONFIG.dev` at `/app/_CONFIG`. The
  first run writes `_CONFIG.dev` from the image's `_CONFIG.example` and asks for the backend URL, the channel and its
  checkout key (or takes `--backend`, `--channel`, `--key`), then starts.
- `build [--tag] [--config]`: a production image of the shop with this theme and `_CONFIG.dev`, on the
  `storefront-builder` of the same version, run on its `storefront-runtime` (`storefront build` with the theme copied in); the registry and a shop's own
  `Dockerfile` stay the way for real shops.
- `list [--all]` (script `pnpm overrides`, `pnpm list` is pnpm's own): what a theme can override, grouped by where it
  shows in the shop with one line each, ✓ at the theme's copies; smaller parts and the UI elements only with `--all`.
  The groups and lines are `packages/theme-default/overrides.json`: a new file of the default theme needs its line
  there (`overrides.test.ts`). `eject <path>`: a copy of one file into `src/`.
- `check`: `tsc` over the theme with the SDK and the default theme, imports only from the contract (SDK, `@theme/*`,
  React, Next, the default theme's dependencies), an override keeps the exports of the file it replaces, and the
  theme renders: every page template and every part the core draws with props (`@theme/lib/check`, on the SDK's
  mocks, `/mocks`) is rendered with the theme's files in place, outside Next (`bin/check/`: Node hooks resolve
  `@theme/*` like the core, transpile TSX with the theme's TypeScript and stand in for `next/link`, `next/image`,
  `next/dynamic` and `next/navigation`). A part that throws is named with the template that reached it and its own
  file and line; a part inside a sheet (the address form) renders nothing on the server, so only that it loads is
  checked. `packages/theme-default/check.test.ts` renders the same checks on the default theme.

The four packages release together (one version); `packages/create-theme/template.test.ts` keeps the template's
React, Next and TypeScript at the core's versions.

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
the builder's own renderer (`CmsDocument`, on the server). A slot is an ordinary contentdb static page published under the reserved route
`layout-<slot>`; without that route nothing renders. A route starting with `layout-` is not a page: the proxy answers 404.
All slot pages come from one request per page render (`app/_components/layout-slots/api.query.ts`: the routes
list, then `static-page?routes=…`, deduplicated with `React.cache()`); the draft in the active language wins.

The footer is not a slot: it is the CMS footer extender (`layout-extender-published/footer/`, edited in the CMS
navigation editor), read by `lib/layout/layout-data.ts` and drawn by the theme's `@theme/layout/footer`. A draft has
a language like a page: the footer is the draft of the visitor's language, else of the shop's default language
(`default` in `countries.config.json`), else the newest (`pick_footer`). The bottom
bar next to "© year name" links every published `legal-page` of the active language (`useLayout().legal`: label the
page's `meta.title`, href its route; none published, no links) and "Cookie settings", an `href="#cookie-consents"`
link that `app/globals.css` hides until a cookie banner runs (see Cookie consent). No flag, no config.

## Blog

Posts are contentdb `blog-post` documents (`published/blog-post/`, scoped to the channel by `default_querys`),
written in the CMS page editor or in AI Studio. All blog pages render on the server (`app/[customer_country]/blog/`;
addresses in `lib/blog-paths.ts`):

| Address | What |
|---|---|
| `/blog` | Posts written in the page language, newest first, 9 per page (`?page=`), a tab per category with posts (`?category_url_key=`). The CMS page published under the route `blog` (what the catch-all served there before) is the intro: its sections above the tabs, its meta title and description |
| `/blog/<slug>` | The post: category, heading, authors and dates, cover, table of contents, body, "About the author", older / newer post. A reading column of `max-w-4xl` (~900 px), the cover across the page |
| `/blog/authors/<slug>` | The author (photo, role, bio, website and social profiles named by their host) and their posts in the page language |

- One route per post, one draft per language (like CMS pages): the post in the page language, else another
  language's (`lang` on the `<article>`); hreflang names the profiles whose language it is written in (the list and
  an author's page: the languages with posts). The version in its language carries the older and newer post
  (`prev` / `next`).
- `utils/NORMALIZERS/blog-post.normalizer.ts`: `NORM_BLOG_POST` (heading from the post's tile, `extension.title`;
  search and share fields from `meta`, `og_image` else the cover; author roles and bios in the page language; an id
  on every H2 of the rich text for the table of contents, a one-word id with `-section`, as DOMPurify drops an id
  that names a `document` property), `NORM_BLOG_POST_CARD` (a tile), `NORM_BLOG_AUTHOR`.
- The body is a CMS document (`CmsDocument`), like a CMS page's.
  AI Studio writes `section-text` sections without tiles and a closing `section-faq` (questions and answers in the
  page, the table of contents' last entry, `FAQPage` in JSON-LD). `[data-article]` in `app/globals.css` gives CMS
  text the body colour and reading spacing.
- `section-blog` on any CMS page: up to three posts the editor picked by route (`blog_section: [{ label }]`), as
  the blog's tiles (`@theme/blog/post-tile`), read with the document's data; a missing post is left out.
- SEO: a post is `og:type=article` with dates, authors and section, JSON-LD `BlogPosting` (authors linked to their
  pages), `FAQPage`, `BreadcrumbList`; the list a `Blog`; an author a `ProfilePage`. A category tab and a later page
  name themselves as canonical; an empty list is `noindex`. The sitemap lists `/blog`, posts and authors per profile
  whose channel publishes posts in its language. `utils/route-exists.ts` answers 404 for an unknown post or author
  (contentdb answers 400 to an unknown route, 404 to an author without published posts); a page past the last one
  renders not-found.
- Categories: `category/?language=` matches the upper-case ISO code only.
- The list has no `loading.tsx` (the post and the author pages do): Next shows a loading fallback on every change of
  the query, which would blank the list and drop the reader at the top. A tab keeps the scroll (`scroll={false}`)
  and pulses while the next list loads (`useLinkStatus`).

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

## Adding to the cart

`lib/buy-rules.ts` decides whether a product can go to the cart, by `product_type`: SIMPLE and BUNDLE check the
stock, then the price; CONFIGURABLE needs a chosen variant, whose stock and price count (the parent has neither);
CUSTOM never goes to the cart (enquiry). The first rule that fails picks the message, so a sold-out product says
"Out of stock" before "Not available online". The product page, the "+" on a tile and the wishlist's "Move to
cart" read it.

- Stock is the real-time `stock/` answer only. `on_stock` of the read model can be stale: it greys out variant
  options, hides the tile's "+" and places the similar products, but never opens the button. Until `stock/`
  answers, or when it fails, the button stays disabled.
- A BUNDLE is asked by its own SKU: what its components allow is for `stock/` to answer, not for the storefront to
  compute.
- The cart page stops the stepper at the stock; a sold-out line stays, flagged by the backend, and can only shrink.

## Product page and catalog extras

- Gallery (`gallery.client.tsx`, `gallery-viewer.client.tsx`): a scroll-snap row (swipe on phones, "3 / 12" counter),
  arrows and a thumbnail strip from `md`, keyboard arrows; a click opens a full-screen viewer (swipe, double-tap and
  pinch zoom, Escape, focus returns to the opener). The first picture is `loading="eager"`, the rest lazy. Hooks:
  `data-gallery`, `data-gallery-thumb`, `data-gallery-counter`, `data-gallery-viewer`.
- Similar products (`related.ts`, `related-products.tsx`; the section is the theme's server part
  `@theme/product/related-products`): server-rendered tiles (crawlable links) from the rules of
  `PRODUCT.RELATED`. Each rule asks `products/` with `q_<idx>=<value>` / `category=` and `on_stock=true`, and every
  candidate is checked again (the API ignores a filter that is not defined in the channel). Never the product itself,
  never a sold-out one; hidden when nothing matches. The server passes the section to `ProductClient`, which places
  it by stock: closing the page, or (sold out) right under the buy area with a lead line.
- Sticky buy bar (`sticky-buy-bar.client.tsx`, `data-buy-bar`, phones): slides in once `[data-buy-area]` is out of
  view (the sticky header does not count as view); price + Add to cart, or on a sold-out product "See similar"
  (link to `#related-products`) and the notify-similar action when the channel offers it; with back-in-stock alerts on,
  a sold-out selection gets "Notify me" (`data-stock-alert-trigger`), which scrolls to the form. Hidden while the cookie
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
  language (`lib/url-keys.ts`, `load_url_key`, read with the document's data before it renders); any failure keeps
  the key the editor typed.

## Contact forms

Forms of the `django_contact_forms` module (`/api/contact-forms/v2/{channel}/...`), all optional. A form shows only
when the channel has `API_CONTACT_FORMS_KEY` (`channels.config.json`) AND `form-types/` lists the form's type;
`lib/contact-forms.ts` holds the check (`useContactFormAvailable`) and the submit. No key, a refused key (401) or
an unknown type: nothing renders and nothing is requested.

- Enquiry (`components/enquiry-form.client.tsx`): honeypot field `website`, required consent with a link to
  `CHECKOUT.PRIVACY_ROUTE`. The product page offers it as a collapsed "Ask about this product" (type
  `product-enquiry`, slug `product-enquiry`, `code` = SKU); a product not sold online (CUSTOM, or no price; `sold_online`
  in `lib/buy-rules.ts`) gets the primary "Ask for the price" instead.
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

## Newsletter

Double opt-in through `django_agreements` (`lib/newsletter.ts`), optional like the contact forms: only a channel
with `API_NEWSLETTER_KEY` (`channels.config.json`, cookie `nl_key`) gets the footer form
(`components/newsletter-form.client.tsx`: email, consent, honeypot) and the opt-in of the register form, which
subscribes after the account is created. `POST newsletter/subscribe/` mails a link to `{STOREFRONT_BASE_URL}`
`/newsletter/confirm?token=` and one to `/newsletter/unsubscribe?token=`; both pages (`app/[customer_country]/newsletter/`)
send the token once (`consents/confirm/`, `consents/unsubscribe/`, no key) and show the result. The backend must point
`STOREFRONT_BASE_URL` at the storefront.

## Back-in-stock alerts

"Tell me when it is back" for one sold-out SKU, through `django_stock_alerts` (`lib/stock-alerts.ts`), optional like the
contact forms: only a channel with `API_STOCK_ALERTS_KEY` (`channels.config.json`, cookie `sa_key`) gets it, read on the
client (`useStockAlertsAvailable`), never in the server render of a product page. No key: the page is unchanged.

- Variant picker: a sold-out option is enabled (it keeps the struck-through look and the sr-only "(unavailable)") and
  writes `?variant=` like any option. Without the key it stays disabled.
- Buy area: once the real-time stock has answered and the chosen variant (or a product without variants) is sold out,
  `components/stock-alert.client.tsx` replaces the stepper and the "Out of stock" button: heading, the product and the
  options ("Series Nebula Heritage"), e-mail (prefilled for a signed-in customer), consent with the privacy link,
  honeypot. With every variant sold out and none chosen the area asks for a choice. "Notify about a similar product"
  still renders below where the channel has contact forms.
- `POST subscriptions/` sends `{email, sku, language, country, consent: true, consent_text, website}`; `consent_text`
  is the consent label as rendered (`stockAlert.consent` with the privacy link label). Answers: 201 saved, 409 in stock
  (the stock is re-read, the buy button comes back), 429 throttled, 400 invalid, anything else failed.
- Saved SKUs are remembered per channel in `localStorage` (`stock-alerts:<channel>`, at most 50, `lib/stock-alert-memory.ts`),
  so the saved state survives a reload; the address is never stored in the browser. A request cancelled from the
  mail link still shows as saved in that browser (the cancel answer names no SKU) until "Use another address".
- `/stock-alert/cancel?token=` (`app/[customer_country]/stock-alert/`, not indexed) is the cancel link of the mails:
  `POST subscriptions/cancel/` once, no key, then "cancelled" or "the link does not work".
- Theme and test hooks: `data-stock-alert`, `data-stock-alert-state` (`idle`, `sending`, `saved`, `in_stock`,
  `throttled`, `invalid`, `failed`, `choose`), `data-stock-alert-trigger`, `data-stock-alert-cancel`.
- The backend needs the module, the channel's `STOCK_ALERTS_PRODUCT_URL` / `STOCK_ALERTS_CANCEL_URL` pointing at the
  storefront and an access token with the scope `stock_alerts.subscribe`.

## Agreements at checkout

The review step (`app/[customer_country]/checkout/_components/review-step.tsx`, `lib/agreements.ts`) shows the
channel's agreement definitions of `django_agreements` meant for the `checkout` context (`GET definitions/for-user/
?context=checkout`, the CMS's "show in" setting of each definition: a definition with `checkout` unticked is not
offered, no code change): every `mandatory` one is a required checkbox, and the `marketing` one of the `email` channel an optional one when the newsletter is offered. The text is
the definition's HTML summary as the backend sends it, since the backend keeps that wording with the order; its
links open in a new tab.

- Order of calls: `POST orders/` first, then `POST orders/{order_id}/agreements/` with the order's billing email
  and the mandatory slugs (the backend takes agreements for an existing order with that email only). One failed call
  is retried (a repeat records nothing new); after that the failure is logged and the order stands. The email
  marketing opt-in is a newsletter subscription (double opt-in) after the order.
- Keys: `API_AGREEMENTS_KEY` (`channels.config.json`, cookie `ag_key`) for the order record, `API_NEWSLETTER_KEY` for
  the subscription. Without the agreements key a guest's agreements are not recorded (django-agreements >= 3.0.1).
- No answer or no mandatory definition: the shop's own consent line (`checkout.terms_consent` with
  `CHECKOUT.TERMS_ROUTE` / `PRIVACY_ROUTE`) stands in, and nothing is recorded.
- Where the documents live: a definition's `content_route` is the CMS page of its full text (the order record takes
  it from there). It is also the route of every legal link of the storefront (`useLegalRoutes`: the privacy link of
  the newsletter, enquiry and notify forms, the shop's own consent line), so a deployment sets it in one place, the
  agreement in the CMS; `CHECKOUT.TERMS_ROUTE` / `PRIVACY_ROUTE` stand in only without it. The links inside a
  summary are written by hand in the definition, so they must name the same route.
- The root layout prefetches the full list (`definitions/`, `lib/agreements.query.ts`, shared cache): the legal links
  of every form read the routes from it. The plain list carries no `display_contexts`, which is why the review step
  asks the `for-user` endpoint (as a guest, so the answer is the same for everyone and shared). A signed-in customer
  sees the same list: the backend would hide an already given consent for a JWT, the storefront does not ask that.

### Agreements at registration

The register form (`components/register-form.client.tsx`, view `@theme/forms/register-form`) offers the definitions
meant for the `registration` context (`definitions/for-user/?context=registration`, prefetched by the root layout):
the `mandatory` ones as required boxes, the email `marketing` one as an optional box when the channel has a
newsletter key; the text is the definition's HTML summary. The core draws the boxes: `AgreementFields`
(`components/agreement-fields.client.tsx`, theme primitives `CheckboxField`, `RichText` for the summary, links in a new
tab) is handed to the view as `consents` in the `RegisterFormModel`, and the theme's register form places it with
`{consents}`. It knows nothing of slugs, field names or required flags. Without a mandatory definition (or an answer)
the same component draws the shop's own pair of boxes (`auth.accept_terms`, `auth.consent_data`) and the newsletter
box. The review step shares only `AgreementSummary` (one agreement's wording) from that file: it keeps its choice in
local state, not in a react-hook-form form, and its fallback is a single `TokenLinks` line.

- After a successful signup the ticked mandatory slugs are recorded with `POST consents/` (source `registration`,
  the channel's agreements key, the email of the form), the newsletter box starts the double opt-in as before.
  A marketing consent cannot be recorded this way: the signup returns no token, and with a key alone the backend
  refuses marketing definitions. Not recorded (no key, refusal) = logged, the account stands.
- The accounts signup keeps its legacy `agreements` flags (`condition` = the mandatory ones accepted, `email` = the
  marketing box, `newsletter` false). The accounts module ignores them today; nothing but django-agreements keeps
  the record.
- Only the email marketing definition is offered: SMS and push consents have no way in for a guest.

## A refused order

`POST orders/` answers 409 when the cart cannot become an order (checkout 10.1): `{ error, message }`, nothing
ordered. `checkout/_components/order-refusal.ts` turns the `error` code into the shop's message and the place the
customer fixes it, shown under the review step's error: a missing address, shipping or payment method, or a missing
pickup point (`DELIVERY_POINT_NOT_SELECTED`), leads back to that step, a sold-out item (`OUT_OF_STOCK`) and a refused discount code or gift (`DISCOUNT_*`, `GRATIS_*`) to the
cart, a voucher on a cart that splits into several orders to the payment step. An unknown code gets the generic
message; the API's English `message` is never shown. Other failures keep the message with the HTTP status.

## Pickup points

A shipping method of type `inpost` or `pickup_point` delivers to a point of `deliverypoints/v2/` instead of the
address. The shipping step then shows `DeliveryPointPicker` (`checkout/_components/delivery-point-picker.client.tsx`):
a search by city, postal code or name (`points/?search=`), "Near me" (the browser's location, `points/nearby/`) and
the list; the point goes to the cart with the method (`PATCH carts/{id}/shipping/`, `delivery_point`), and the review,
the success page and the account's order show it. Which point types fit a method: `lib/delivery-points/point-types.ts`
(InPost lockers for `inpost`, every type for `pickup_point`, `DELIVERY_POINTS.TYPES_BY_METHOD` per method code).
With `DELIVERY_POINTS.GOOGLE_MAPS_API_KEY` and `GOOGLE_MAPS_MAP_ID` set, a Google map beside the list
(`delivery-point-map.client.tsx`, `next/dynamic`) opens at the geocoded shipping address and searches the area it
shows; the CSP then adds Google's sources (`GOOGLE_MAPS_CSP`). The points always come from the backend, never from
Google. The map has not been run against the live Maps JavaScript API yet (Google issues no test key): the first
deployment that sets a key checks it. If the API fails to load, the map hides itself and the list keeps working.

## Cookie consent

`app/_components/cookie-consent/`, mounted as `<CookieConsent />` in `app/layout.tsx`. After hydration it asks
`GET /api/agreements/v2/__CHANNEL__/cookie-banner/` (django-agreements >= 2.2.0) through the API layer.

- No banner on the backend (404, module absent): nothing is loaded, and the answer is cached for the session.
- With a banner, `consent-banner.ts` loads `vanilla-cookieconsent` as a separate chunk with its stylesheet
  (`cookie-consent.css`, the library's in a cascade layer) and the banner's look, the theme's
  `@theme/cookie-consent.css` in the same layer; a shop's `_CONFIG/theme.css` overrides either.
  Every text comes from the backend; never put banner copy in the storefront.
- Decisions go to `POST .../cookie-consents/`; a 409 means a newer banner was published: refetch and ask again.
- Any link whose `href` ends with `#cookie-consents` reopens the preferences; `app/globals.css` hides such links
  until a banner runs. A CMS button of type `external` with a `#…` url stays in the same tab.
- The storefront ships no tags: `apply_consent()` in `consent-mode.ts` is the one place a tag learns about the
  decision (Consent Mode signals).
- The library hides the banner from bots (`navigator.webdriver` included): a Playwright check has to override that.
