// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, type APIRequestContext } from "@playwright/test";

// The local backend sends mail to GreenMail (zeno `make mail`); its REST API keeps one mailbox per recipient.
export const GREENMAIL = process.env.GREENMAIL_API_URL ?? "http://localhost:8380";

// The MIME sources of the recipient's mails with this subject, oldest first; null while the mailbox does not exist.
async function sources(request: APIRequestContext, email: string, subject: string): Promise<string[] | null> {
  const res = await request.get(`${GREENMAIL}/api/user/${encodeURIComponent(email)}/messages/INBOX`);
  if (!res.ok()) return null;
  const messages: { subject: string; mimeMessage: string }[] = await res.json();
  return messages.filter((m) => m.subject === subject).map((m) => m.mimeMessage);
}

// How many mails with this subject the recipient has. A fixed test account keeps the mails of earlier runs (GreenMail
// outlives a reseed), so a spec counts them before the action that sends one and waits for the next.
export async function mail_count(request: APIRequestContext, email: string, subject: string): Promise<number> {
  return (await sources(request, email, subject))?.length ?? 0;
}

// Waits for a mail with this subject past the first `earlier` ones and returns the newest one's MIME source.
export async function mail(request: APIRequestContext, email: string, subject: string, earlier = 0): Promise<string> {
  let mime = "";
  await expect
    .poll(
      async () => {
        const found = await sources(request, email, subject);
        mime = found && found.length > earlier ? found[found.length - 1] : "";
        return mime ? "received" : null;
      },
      { message: `no new "${subject}" mail for ${email} in GreenMail (${GREENMAIL}) — is \`make mail\` up?` },
    )
    .toBe("received");
  return mime;
}

// Path and query of the first link to `route` in the mail. The mail is multipart; the HTML part is
// quoted-printable (soft breaks, =3D) and the link's & is an entity.
export function link_path(mime: string, route: string): string | null {
  const decoded = mime
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  const link = decoded.match(new RegExp(`https?://[^"\\s<>]*/${route}\\?[^"\\s<>]+`))?.[0];
  if (!link) return null;
  const url = new URL(link.replaceAll("&amp;", "&"));
  return `${url.pathname}${url.search}`;
}
