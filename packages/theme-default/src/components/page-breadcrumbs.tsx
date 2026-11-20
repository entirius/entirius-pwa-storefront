// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Fragment } from "react";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import type { Crumb } from "@entirius/storefront-sdk/layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@theme/ui/breadcrumb";

// Home + trail; the last crumb is the current page (not a link).
export function PageBreadcrumbs({ trail }: { trail: Crumb[] }) {
  const { t } = useI18n();
  const crumbs: Crumb[] = [{ name: t("breadcrumbs.home"), href: "/" }, ...trail];
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${i}-${crumb.name}`}>
              <BreadcrumbItem>
                {last || !crumb.href ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// API category trail ({ name, url_key }[]) → crumbs linking to the catalog.
