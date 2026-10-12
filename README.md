# entirius-pwa-storefront

The storefront of Entirius, the open-source modular ecommerce platform: the shop customers browse and buy in.
Catalog, search, cart, checkout and customer account run against the REST APIs of the backend, rendered on the
server with Next.js (App Router, React Server Components).

Multi-country by design: every route lives under a country segment (`/{country}/...`) and the middleware resolves
country, language, currency and sales channel into cookies before the page renders.

## What it does

- Category listings with filters, sorting and pagination, and product detail pages.
- Header search with live results: phrases, categories and products.
- Cart and wishlist kept in the browser, the cart synchronised with the backend.
- Checkout as a stepper: address, shipping, payment, review.
- Customer account: sign-up with email activation, login, profile, addresses, orders.
- Pages built in the CMS, served through a catch-all route.

## Installation

```shell
git clone https://github.com/entirius/entirius-pwa-storefront.git
cd entirius-pwa-storefront
cp -r _CONFIG.example _CONFIG
pnpm install
```

`_CONFIG/` is gitignored and required: the code imports its JSON files directly, so the build fails without it.
Set `API_BASE_URL` in `_CONFIG/app.config.json` and the checkout key of each channel in
`_CONFIG/channels.config.json`; every key is described in
https://github.com/entirius/entirius-pwa-storefront/blob/develop/docs/configuration.md.

## Quick start

```shell
pnpm dev
```

Open `http://localhost:3000`. Unknown countries fall through to the `default` segment.

## Requirements

- Node.js 20 or newer.
- pnpm (`corepack enable` or `npm i -g pnpm`); npm and yarn are not supported.
- A running Entirius backend reachable over HTTP (default `http://localhost:8000`).

## Documentation

- Developer docs (architecture, configuration, search):
  https://github.com/entirius/entirius-pwa-storefront/tree/develop/docs
- Entirius documentation: https://docs.entirius.com/
- Releases: https://github.com/entirius/entirius-pwa-storefront/releases

## Part of Entirius

The storefront is the customer-facing frontend of the platform; it reads the catalog, content, checkout and
account APIs of the Entirius backend service.

- Backend service: https://github.com/entirius/entirius-service-volkanos
- Docker harness (backend, CMS and storefront in one stack): https://github.com/entirius/entirius-zeno
- Admin CMS: https://github.com/entirius/entirius-pwa-cms

## Development

```shell
pnpm dev      # dev server on port 3000
pnpm build    # production build
pnpm start    # serve the production build
pnpm lint     # ESLint (eslint-config-next)
```

Development and agent instructions: https://github.com/entirius/entirius-pwa-storefront/blob/develop/AGENTS.md

## License

Mozilla Public License 2.0 (MPL-2.0) — see https://github.com/entirius/entirius-pwa-storefront/blob/develop/LICENSE.
