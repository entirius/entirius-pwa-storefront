// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";
import { API_CMS_FOOTER_ROUTE } from "@/API/api.routes";
import { LinkDynamic } from "@/lib/link-dynamic";
import { NORM_FOOTER, type FooterLink } from "@/utils/NORMALIZERS/footer.normalizer";
import { SITE_NAME } from "@/_CONFIG/app.config.json";

// One request per render, whatever renders the footer.
const load_footer = cache(async () => {
  const api = create_api(await make_server_access());
  const [error, response] = await api.FETCH_METHOD(API_CMS_FOOTER_ROUTE, {});
  return error ? [] : NORM_FOOTER(response);
});

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className = "text-sm text-muted-foreground transition-colors hover:text-foreground";
  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {link.label}
    </a>
  ) : (
    <LinkDynamic href={link.href} className={className}>
      {link.label}
    </LinkDynamic>
  );
}

// Link columns from the CMS `footer` layout extender; with none published the
// footer keeps only the shop name line.
export async function FooterComponent() {
  const columns = await load_footer();
  return (
    <footer className="mt-12 border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        {columns.length > 0 && (
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {columns.map((column, i) => (
              <div key={`${i}-${column.heading}`} className="flex flex-col gap-3">
                {column.heading && <h2 className="text-sm text-heading">{column.heading}</h2>}
                <ul className="flex flex-col gap-2">
                  {column.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        )}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
