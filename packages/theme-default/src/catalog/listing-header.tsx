// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useListingPage } from "@entirius/storefront-sdk/catalog/listing";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Link } from "@entirius/storefront-sdk/components/link";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { PageBreadcrumbs } from "@theme/components/page-breadcrumbs";
import { ExpandableText } from "@theme/ui/expandable-text";

// The listing's title block: breadcrumbs, the title, a category's description and its subcategories.
export function ListingHeader() {
  const { t } = useI18n();
  const { kind, header } = useListingPage();
  if (!header) return null;

  return (
    <header
      data-catalog-header={kind === "category" || undefined}
      data-search-header={kind === "search" || undefined}
      className="mb-6 flex flex-col gap-4"
    >
      <PageBreadcrumbs trail={header.trail} />
      <div className="surface flex flex-wrap items-end justify-between gap-4 bg-gradient-backdrop">
        <div>
          <h1 className="text-4xl leading-tight md:text-5xl">{header.title}</h1>
          {header.description_html && (
            // Size and colour sit on the wrapper (the h1's next sibling, a theme hook); the text inherits them.
            <ExpandableText className="mt-1 text-muted-foreground md:text-lg" likely_long={header.description_long}>
              <RichText html={header.description_html} />
            </ExpandableText>
          )}
        </div>
        {header.subcategories.length > 0 && (
          <nav aria-label={t("catalog.subcategories")} className="flex flex-wrap gap-2">
            {header.subcategories.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                className="rounded-chip border border-border bg-card px-4 py-2 text-sm font-medium text-heading transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {sub.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
