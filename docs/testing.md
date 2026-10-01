# Testing

Two layers:

- **Unit — Vitest** (`vitest.config.mts`): `pnpm test`. Pure logic (normalizers, query helpers, link resolution), `*.test.ts` next to the file it tests, no network. Runs in CI as the `test` job.
- **E2E — Playwright** (`playwright.config.ts`, specs in `tests/e2e/`): `pnpm test:e2e`. Needs the live backend, so it runs locally, not in CI yet.

```bash
pnpm test:e2e              # headless; reuses a running `pnpm dev`, starts one otherwise
pnpm test:e2e --headed     # watch the browser
pnpm test:e2e --ui         # Playwright UI mode
```

- Uses the locally installed Google Chrome (`channel: "chrome"`) — no `playwright install` needed.
- `baseURL` is `SITE_URL` from `_CONFIG/app.config.json`.
- Tests hit a **live backend** with seeded data (the reference dataset of the `default-europe` channel). There are no API mocks; a missing or wrong backend fails every spec.
- Enter pages through the proxy (`page.goto("/catalog/...")`), never by setting country cookies by hand — the proxy is part of what is tested.
- A known gap is marked `test.fixme(...)` with the reason, not deleted.
- `checkout-guest.spec.ts` places a real order, and every order reserves stock for good. After ~50 runs the test product (`ENT-C001`) is out of stock and every spec that adds it to the cart fails with "Out of stock" — reseed the backend, then recreate the local test account.
- Failure screenshots and traces land in `test-results/` (gitignored); open a trace with `pnpm exec playwright show-trace <path>`.
- `visual.spec.ts` compares home, catalog, PDP and cart with baselines in `tests/e2e/visual.spec.ts-snapshots/` (per OS, product photos masked). After an intended visual change: `pnpm test:e2e visual --update-snapshots=all`, then review the new PNGs in the diff. `contrast.spec.ts` checks WCAG AA of the semantic color pairs.
