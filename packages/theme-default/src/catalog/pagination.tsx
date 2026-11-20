// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useListingPage } from "@entirius/storefront-sdk/catalog/listing";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@theme/ui/pagination";

// Previous and next page; nothing on a single page. Both bars (above and under the grid) page the same list.
export function ListingPagination({ className }: { className?: string }) {
  const { pagination } = useListingPage();
  const { page, has_prev, has_next, go, pending } = pagination;
  if (!has_prev && !has_next) return null;

  const disabled = pending ? "pointer-events-none opacity-50" : "";

  return (
    <Pagination className={className}>
      <PaginationContent>
        {has_prev && (
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                go(page - 1);
              }}
              className={disabled}
            />
          </PaginationItem>
        )}
        {has_next && (
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                go(page + 1);
              }}
              className={disabled}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
