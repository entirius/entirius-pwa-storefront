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
- `signup.spec.ts` reads the confirmation mail from GreenMail, the local backend's mail sandbox (zeno `make mail`, REST `http://localhost:8380`; another URL via `GREENMAIL_API_URL`). So does `support/account.ts` when it signs up a test customer: since accounts 6.0.1 the signup response carries no confirmation key, the link in the mail is the only way to activate. The backend must build the link with `NEW_ACCOUNT_REDIRECT_URL` pointing at this storefront's `/user-handler` (zeno sets `http://localhost:3100/user-handler`). `password.spec.ts` reads the reset mail the same way; the backend builds its link with `RESET_PASSWORD_REDIRECT_URL`, which must point at `/reset-password` (`http://localhost:3100/reset-password` locally) — unset, every reset request answers 500.
- Test customers (`support/account.ts`). accounts >= 6.0.2 limits signup to 10 an hour, login to 30 a minute and the password reset mail to 3 an hour per e-mail, per address, and every call of the suite comes from one address (the docker gateway). So a spec with a signed-in customer does not sign one up on every run:
  - `test_account(request, name)`: the spec's own `e2e-<name>@example.com`, signed up only while it does not exist (a fresh database, a reseed); `demo_account(request)`: the demo customer of manual checks (`cart-merge.spec.ts`; not in the seed, signed up the same way when missing); `fresh_account(request, what)`: a new one, only where a fixed one cannot serve (the password reset, limited per e-mail).
  - Each spec starts by resetting its customer (open carts closed, and on request the address book, the wishlist, the profile names), not by cleaning up at its end, so a run stopped half-way does not break the next one. Two specs never share a customer: the two workers run specs side by side. `password.spec.ts` puts the password back after changing it, and the next run does it when one stopped in between.
  - A full run signs up three customers (`signup.spec.ts`, `newsletter.spec.ts`, the reset), so about three full runs fit in an hour. API sign-ins are kept per worker for 4 minutes to stay under the login limit.
  - A fixed customer's GreenMail mailbox keeps the mails of earlier runs: count them first (`mail_count`) and wait for the next (`mail(..., earlier)`).
- `wishlist-account.spec.ts` needs the accounts product list (SKUs per channel, which the account wishlist accepts) filled from PIM. The test package seed runs `fill-accounts-product-representation-from-pim`; on a stack seeded before that, run it once in the service container (`python manage.py fill-accounts-product-representation-from-pim`) — empty, every wishlist add answers 400 "No SKUs in accounts product representation".
- A known gap is marked `test.fixme(...)` with the reason, not deleted.
- django-agreements >= 3.0.1 lets one email address subscribe to the newsletter three times an hour (429 after that). A spec that subscribes for real uses a fresh address (`newsletter.spec.ts`); one that only checks the storefront sends the subscription answers the call itself (`checkout-guest.spec.ts`).
- `checkout-guest.spec.ts` places a real order, and every order reserves stock for good. After ~50 runs the test product (`ENT-C001`) is out of stock and every spec that adds it to the cart fails with "Out of stock" — reseed the backend (the test customers, the demo one included, are signed up again on the next run).
- Failure screenshots and traces land in `test-results/` (gitignored); open a trace with `pnpm exec playwright show-trace <path>`.
- `visual.spec.ts` compares home, catalog, PDP and cart with baselines in `tests/e2e/visual.spec.ts-snapshots/` (per OS, product photos masked). After an intended visual change: `pnpm test:e2e visual --update-snapshots=all`, then review the new PNGs in the diff. `contrast.spec.ts` checks WCAG AA of the semantic color pairs.
