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
- `signup.spec.ts` reads the confirmation mail from GreenMail, the local backend's mail sandbox (zeno `make mail`, REST `http://localhost:8380`; another URL via `GREENMAIL_API_URL`). The backend must build the link with `NEW_ACCOUNT_REDIRECT_URL` pointing at this storefront's `/user-handler` (zeno sets `http://localhost:3100/user-handler`). `password.spec.ts` reads the reset mail the same way; the backend builds its link with `RESET_PASSWORD_REDIRECT_URL`, which must point at `/reset-password` (`http://localhost:3100/reset-password` locally) — unset, every reset request answers 500.
- `wishlist-account.spec.ts` needs the accounts product list (SKUs per channel, which the account wishlist accepts) filled from PIM. The test package seed runs `fill-accounts-product-representation-from-pim`; on a stack seeded before that, run it once in the service container (`python manage.py fill-accounts-product-representation-from-pim`) — empty, every wishlist add answers 400 "No SKUs in accounts product representation".
- A known gap is marked `test.fixme(...)` with the reason, not deleted.
- `checkout-guest.spec.ts` places a real order, and every order reserves stock for good. After ~50 runs the test product (`ENT-C001`) is out of stock and every spec that adds it to the cart fails with "Out of stock" — reseed the backend, then recreate the local test account.
- Failure screenshots and traces land in `test-results/` (gitignored); open a trace with `pnpm exec playwright show-trace <path>`.
- `visual.spec.ts` compares home, catalog, PDP and cart with baselines in `tests/e2e/visual.spec.ts-snapshots/` (per OS, product photos masked). After an intended visual change: `pnpm test:e2e visual --update-snapshots=all`, then review the new PNGs in the diff. `contrast.spec.ts` checks WCAG AA of the semantic color pairs.
