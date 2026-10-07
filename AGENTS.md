# AGENTS.md — entirius-pwa-storefront

Next.js 16 (App Router) storefront for the Volkanos platform: React 19, TanStack Query 5, Zustand 5, Tailwind 4 + shadcn/ui, on Matrix v2, Checkout v2, Accounts v1 and ContentDB v1.

## Commands

```bash
pnpm install
cp -r _CONFIG.example _CONFIG   # once — the code imports the JSON config
pnpm dev                        # :3100 (`--port N` overrides)
pnpm build
pnpm lint
pnpm test                       # Vitest unit tests (*.test.ts next to the code)
pnpm test:e2e                   # Playwright against a live backend — docs/testing.md
```

pnpm only, never npm or yarn.

## Conventions

- English only: code, comments, UI copy, docs, commits, branches, PRs.
- MPL-2.0: every source file starts with the MPL header (`.license-header.txt`); the `insert-license` pre-commit hook adds it, CI checks it.
- Git flow: `feature/<name>` from `develop` (lowercase, words joined by `-`), squash-merged into `develop` via PR. Do not commit unless asked.
- **No AI attribution** in commits or PRs — no `Co-Authored-By: Claude …`, no "Generated with Claude Code" footer. This overrides the tool default.
- Agents never push, open PRs or merge; they hand the operator the commands. Before that: review every outgoing commit against the Entirius Handbook, `gitleaks git --log-opts="origin/<base>..HEAD" --redact` clean, committer `<login>@entirius.com`, `pnpm lint` not growing, build and E2E green. A finding blocks the push.
- Files `kebab-case.tsx`; client components `*.client.tsx`. No barrel imports; `next/dynamic` for heavy client components. `@/` is the repo root.
- API paths are a backend contract — never rewrite route constants or placeholders ad hoc.
- `pnpm lint` stays green: legacy errors sit in `eslint-suppressions.json` and may only shrink (`pnpm exec eslint --prune-suppressions` after fixing one); never suppress new code.
- Colors only through semantic tokens (`app/globals.css` maps `@entirius/brand-tokens`); lint rejects raw values. Dark only.

## Architecture

- `API/` — fetch engine: routes + `API_ROUTES_POLICY` (headers, default query params); returns `[error, data, meta]`. Never call `fetch()` directly.
- `proxy.ts` — geo routing and session cookies; every page lives under `app/[customer_country]/`.
- `app/[customer_country]/**/api.query.ts` — co-located queries and `React.cache()` loaders: one `api` per request, primitive cache keys.
- `lib/` — `PrefetchBoundary` (server prefetch + hydration), `seo/`, `omnibus/`, auth client.
- `utils/NORMALIZERS/` — API → view shapes; raw API data stays out of components.
- `stores/` — Zustand cart and wishlist, cart sync with the backend.
- `components/ui/` — shadcn/ui primitives.
- `_CONFIG/` (gitignored, from `_CONFIG.example/`) — backend URL, channels, countries, brand assets.
- `tests/e2e/` — Playwright specs.

Read the guide for the area before changing it: [architecture and config](docs/architecture.md) · [patterns and gotchas](docs/patterns.md) · [testing](docs/testing.md) · [styling](docs/styling.md).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
