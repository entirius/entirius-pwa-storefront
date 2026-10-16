// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type APIRequestContext } from "@playwright/test";

// Registration with the e-mail confirmation, as a customer goes through it: the
// form in the account sheet, the "Signup Confirmation" mail, its link to
// /user-handler, then signing in. The local backend sends mail to GreenMail
// (zeno `make mail`); its REST API keeps one mailbox per recipient.

const GREENMAIL = process.env.GREENMAIL_API_URL ?? "http://localhost:8380";
const PASSWORD = "E2e-Signup-2026!";

// The mail is multipart; the HTML part is quoted-printable (soft breaks, =3D) and
// the link's & is an entity.
function activation_path(mime: string): string | null {
  const decoded = mime
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  const link = decoded.match(/https?:\/\/[^"\s<>]*\/user-handler\?[^"\s<>]+/)?.[0];
  if (!link) return null;
  const url = new URL(link.replaceAll("&amp;", "&"));
  return `${url.pathname}${url.search}`;
}

async function confirmation_mail(request: APIRequestContext, email: string): Promise<string> {
  let mime = "";
  await expect
    .poll(
      async () => {
        const res = await request.get(`${GREENMAIL}/api/user/${encodeURIComponent(email)}/messages/INBOX`);
        if (!res.ok()) return null;
        const messages: { subject: string; mimeMessage: string }[] = await res.json();
        mime = messages.find((m) => m.subject === "Signup Confirmation")?.mimeMessage ?? "";
        return mime ? "received" : null;
      },
      { message: `no confirmation mail for ${email} in GreenMail (${GREENMAIL}) — is \`make mail\` up?` },
    )
    .toBe("received");
  return mime;
}

test("a new customer registers, confirms the e-mail and signs in", async ({ page, request }) => {
  const email = `e2e-signup-${Date.now()}@example.com`;

  await page.goto("/");
  await page.locator("header").getByRole("button", { name: "Sign in" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Register" }).click();
  await expect(sheet.getByRole("heading", { name: "Create account" })).toBeVisible();
  await sheet.getByLabel("Email").fill(email);
  await sheet.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await sheet.getByLabel("Confirm password").fill(PASSWORD);
  await sheet.getByLabel("I accept the terms of service and privacy policy.").check();
  await sheet.getByLabel("I consent to the processing of my personal data.").check();
  await sheet.getByRole("button", { name: "Create account" }).click();
  await expect(sheet.getByText("Account created — check your email to confirm, then sign in.")).toBeVisible();

  const path = activation_path(await confirmation_mail(request, email));
  expect(path, "activation link in the mail").not.toBeNull();
  await page.goto(path!);
  await expect(page.getByRole("heading", { name: "Verification complete" })).toBeVisible();

  await page.locator("header").getByRole("button", { name: "Sign in" }).click();
  await sheet.getByLabel("Email").fill(email);
  await sheet.getByLabel("Password").fill(PASSWORD);
  await sheet.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText(email)).toBeVisible();
});

test("a broken activation link says the verification failed", async ({ page }) => {
  await page.goto("/user-handler?key=not-a-key&uid=00000000-0000-0000-0000-000000000000");
  await expect(page.getByRole("heading", { name: "Verification failed" })).toBeVisible();
});
