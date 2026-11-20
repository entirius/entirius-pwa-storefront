// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { BlogPagination as BlogPaginationModel } from "@entirius/storefront-sdk/blog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@theme/ui/pagination";

// Numbered pages as plain links.
export function BlogPagination({ pagination }: { pagination: BlogPaginationModel | null }) {
  if (!pagination) return null;
  return (
    <Pagination className="py-8">
      <PaginationContent>
        {pagination.prev && (
          <PaginationItem>
            <PaginationPrevious href={pagination.prev} rel="prev" />
          </PaginationItem>
        )}
        {pagination.pages.map((page, i) => (
          <PaginationItem key={page?.number ?? `gap-${i}`}>
            {page ? (
              <PaginationLink href={page.href} isActive={page.current}>
                {page.number}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        {pagination.next && (
          <PaginationItem>
            <PaginationNext href={pagination.next} rel="next" />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
