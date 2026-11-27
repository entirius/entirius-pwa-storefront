// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import type { FooterLink } from "@entirius/storefront-sdk/layout";
import { useLayout } from "@entirius/storefront-sdk/layout/context";
import { useStorefront } from "@entirius/storefront-sdk/storefront";
import { BrandMark } from "@theme/layout/brand-mark";

const LINK_CLASS = "text-sm text-muted-foreground transition-colors hover:text-foreground";

function FooterLinkItem({ link }: { link: FooterLink }) {
  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={LINK_CLASS}>
      {link.label}
    </Link>
  );
}

// Link columns from the CMS `footer` layout extender; with none published the
// footer keeps only the shop name line.
// The footer: logo, the VAT note, the newsletter form and the link columns of the CMS footer.
export function Footer() {
  const { t } = useI18n();
  const { site, footer: columns, legal } = useLayout();
  const { Newsletter } = useStorefront().forms;
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div data-footer-columns className="mx-auto grid w-full max-w-(--page-max-width) grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <BrandMark />
          <p className="max-w-xs text-sm text-muted-foreground">
            {t("footer.prices_incl_vat")}
          </p>
          <Newsletter className="mt-3" />
        </div>
        {columns.length > 0 && (
          <nav aria-label={t("footer.nav")} className="col-span-2 grid grid-cols-2 gap-8 md:col-span-3 md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
            {columns.map((column, i) => (
              <div key={`${i}-${column.heading}`} className="flex flex-col gap-3">
                {column.heading && (
                  <h2 className="text-base text-heading">{column.heading}</h2>
                )}
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
      </div>
      <div data-footer-bottom className="border-t border-border">
        <div className="mx-auto flex w-full max-w-(--page-max-width) flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {site.name}
          </p>
          <nav aria-label={t("footer.legal")} className="flex flex-wrap gap-x-6 gap-y-2">
            {legal.map((link) => (
              <FooterLinkItem key={link.href} link={link} />
            ))}
            {/* Hidden by app/globals.css until a cookie banner runs; the core reopens the preferences on click. */}
            <a href="#cookie-consents" className={LINK_CLASS}>
              {t("footer.cookie_settings")}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
