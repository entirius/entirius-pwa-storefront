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
- A running Volkanos backend reachable over HTTP (default `http://localhost:8000`)

## Quick Start

`_CONFIG/` is gitignored and **required** — JSON config is imported directly by the code, so the build fails
without it. Copy the committed template first:

```bash
cp -r _CONFIG.example _CONFIG
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Unknown countries fall through to the `default` segment.

## Configuration

| File | Keys |
|---|---|
| `_CONFIG/app.config.json` | `API_BASE_URL` (backend URL), `DEBUG_MODE` (enables `_LOGGER` output) |
| `_CONFIG/channels.config.json` | per channel: `CHANNEL_LABEL`, `API_CHECKOUT_KEY` (checkout `x-api-key`) |
| `_CONFIG/countries.config.json` | per country: languages, currencies, channels + defaults |

The template ships the two channels of the reference dataset (`default-europe`, `default-local`);
replace `API_CHECKOUT_KEY` with the key issued by your backend for each channel.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint (`eslint-config-next`) |

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

Details for contributors and coding agents → [AGENTS.md](AGENTS.md).

## License

[MPL-2.0](LICENSE).
