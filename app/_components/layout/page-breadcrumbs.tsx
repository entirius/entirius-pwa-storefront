// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Fragment } from "react";

import { LinkDynamic } from "@/lib/link-dynamic";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = { name: string; href?: string };

// Home + trail; the last crumb is the current page (not a link).
export function PageBreadcrumbs({ trail }: { trail: Crumb[] }) {
  const crumbs: Crumb[] = [{ name: "Home", href: "/" }, ...trail];
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
                    <LinkDynamic href={crumb.href}>{crumb.name}</LinkDynamic>
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
export function category_trail(
  path: { name?: string; url_key?: string }[] | undefined,
): Crumb[] {
  return (path ?? [])
    .filter((c) => c?.name)
    .map((c) => ({
      name: c.name as string,
      href: c.url_key ? `/catalog/${c.url_key}` : undefined,
    }));
}
