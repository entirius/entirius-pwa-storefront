// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { page_numbers } from "@/lib/blog-paths";

// Numbered pages as plain links (`?page=`). `href`: the address of a page, profile included.
export function BlogPagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <Pagination className="py-8">
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious href={href(page - 1)} rel="prev" />
          </PaginationItem>
        )}
        {page_numbers(page, pages).map((n, i) => (
          <PaginationItem key={n ?? `gap-${i}`}>
            {n === null ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={href(n)} isActive={n === page}>
                {n}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        {page < pages && (
          <PaginationItem>
            <PaginationNext href={href(page + 1)} rel="next" />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
