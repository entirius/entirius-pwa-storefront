# Storefront — Entirius PWA

Customer-facing e-commerce storefront for the Volkanos platform. Next.js 16 App Router with React Server
Components; catalog, search, cart, checkout and customer account run against the platform REST APIs
(Matrix v2, Checkout v2, Accounts v1, ContentDB v1).

Multi-country by design: every route lives under a country segment (`/{country}/...`) and the middleware
resolves country, language, currency and sales channel into cookies before the page renders.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, lucide-react |
| Server state | TanStack Query v5 (server prefetch + hydration) |
| Client state | Zustand v5 (cart, wishlist, catalog filters) |
| Forms | React Hook Form + Zod |
| Package manager | pnpm (do not use npm or yarn) |

## Prerequisites

- Node.js 20+
- pnpm 10+ (`corepack enable` or `npm i -g pnpm`)
- A running Volkanos backend reachable over HTTP. The template points at `http://localhost:8000`; the
  zeno local stack publishes the API on `http://localhost:8100` — set `API_BASE_URL` to match

## Quick Start

`_CONFIG/` is gitignored and **required** — JSON config is imported directly by the code, so the build fails
without it. Copy the committed template first:

```bash
cp -r _CONFIG.example _CONFIG
pnpm install
pnpm dev
```

Open `http://localhost:3100`. Unknown countries fall through to the `default` segment.

## Configuration

| File | Keys |
|---|---|
| `_CONFIG/app.config.json` | `API_BASE_URL` (backend URL), `SITE_URL` (public URL of the shop, also the E2E `baseURL`), `SITE_NAME`, `CHECKOUT` (optional `TERMS_ROUTE` / `PRIVACY_ROUTE`: CMS routes linked from the consent line of the review step), `BRAND` (assets in `_CONFIG/brand/`: logo, favicon, optional app icons for the web app manifest, default share image, `THEME_COLOR`, `BACKGROUND_COLOR`, `SHORT_NAME`; see [configuration](docs/configuration.md)), `DEBUG_MODE` (enables `_LOGGER` output and dev tools) |
| `_CONFIG/channels.config.json` | per channel: `CHANNEL_LABEL`, `API_CHECKOUT_KEY` (checkout `x-api-key`), optional `API_CONTACT_FORMS_KEY` (contact-forms `X-API-KEY`: switches on the enquiry form and the CMS form block) |
| `_CONFIG/countries.config.json` | per country: languages, currencies, channels + defaults |
| `_CONFIG/theme.css` | client theme: overrides the values of the theme variables of `app/globals.css` (colours, `--radius`, `--font-family-sans`); empty = default look |
| `_CONFIG/messages.config.json` | optional: overrides of single interface messages per language |

The template ships the two channels of the reference dataset (`default-europe`, `default-local`);
replace `API_CHECKOUT_KEY` with the key issued by your backend for each channel. An existing `_CONFIG/` from before
the client theme needs `theme.css` too (copy it from `_CONFIG.example/`).

The cookie banner needs no config: when the backend has a published banner for the channel (django-agreements
2.2.0 or newer), the storefront shows it, with every text from the backend; otherwise nothing is loaded.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Dev server on port 3100 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint (`eslint-config-next`) |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright E2E against a live backend with the reference dataset (see [docs/testing.md](docs/testing.md)) |

## Architecture

```
API/                    Fetch engine: route constants, policies, cookie access adapters
app/
├── layout.tsx          Root layout (providers, fonts)
├── _components/layout/ Header, navigation, search, cart / wishlist / account sheets
└── [customer_country]/ All routed pages
    ├── (builder)/      CMS pages (catch-all slug)
    ├── (catalog)/      Category listing with filters, sorting, pagination
    ├── (product)/      Product detail page
    ├── checkout/       Address → shipping → payment → review stepper
    └── profile/        Account: profile, addresses, orders
components/ui/          shadcn/ui primitives
lib/                    Auth server actions, prefetch boundary, logger, cn()
stores/                 Zustand stores (cart, wishlist) + cart sync
utils/                  NORMALIZERS (API → view shapes), Zod schemas, cookie helper
proxy.ts                Middleware: geo routing + session cookie injection
```

Details for contributors and coding agents → [AGENTS.md](AGENTS.md) and [docs/](docs/).

## License

[MPL-2.0](LICENSE).
