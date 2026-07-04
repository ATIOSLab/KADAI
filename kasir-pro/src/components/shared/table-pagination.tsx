"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TABLE_PAGE_SIZE_OPTIONS } from "@/lib/pagination";

type PaginationToken = number | "ellipsis";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  itemLabel?: string;
  className?: string;
  pageSizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function buildPageTokens(page: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visiblePages = new Set([
    1,
    totalPages,
    page - 1,
    page,
    page + 1,
  ]);

  const sortedPages = Array.from(visiblePages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right);

  const tokens: PaginationToken[] = [];

  sortedPages.forEach((value, index) => {
    const previous = sortedPages[index - 1];

    if (previous && value - previous > 1) {
      tokens.push("ellipsis");
    }

    tokens.push(value);
  });

  return tokens;
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  itemLabel = "data",
  className,
  pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  if (totalItems <= 0) {
    return null;
  }

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  const pageTokens = buildPageTokens(page, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-black/10 pt-4 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-muted">
            Baris per halaman
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-9 w-[88px] rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm font-medium text-text-muted">
          Menampilkan {startItem}-{endItem} dari {totalItems} {itemLabel}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {pageTokens.map((token, index) =>
            token === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-8 w-8 items-center justify-center text-text-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <Button
                key={token}
                variant={token === page ? "outline" : "ghost"}
                size="sm"
                aria-current={token === page ? "page" : undefined}
                className={cn(
                  "min-w-8 px-0",
                  token === page && "bg-bg-main"
                )}
                onClick={() => onPageChange(token)}
              >
                {token}
              </Button>
            )
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
