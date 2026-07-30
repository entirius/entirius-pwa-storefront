"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Props {
  pagination: any;
  current_page: number;
  className?: string;
}

export function PaginationClient({ pagination, current_page, className }: Props) {
  const router = useRouter();
  const search_params = useSearchParams();
  const [is_pending, start_transition] = useTransition();

  const has_prev = current_page > 1;
  const has_next = pagination?.has_next_page ?? false;

  const go_to_page = (page: number) => {
    const params = new URLSearchParams(search_params.toString());
    params.set("page", String(page));
    start_transition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  if (!has_prev && !has_next) return null;

  const disabled = is_pending ? "pointer-events-none opacity-50" : "";

  return (
    <Pagination className={className}>
      <PaginationContent>
        {has_prev && (
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => { e.preventDefault(); go_to_page(current_page - 1); }}
              className={disabled}
            />
          </PaginationItem>
        )}
        {has_next && (
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => { e.preventDefault(); go_to_page(current_page + 1); }}
              className={disabled}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
