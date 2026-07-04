export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) {
    return 1;
  }

  return Math.min(Math.max(page, 1), totalPages);
}

export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = clampPage(page, totalPages);

  return {
    page: safePage,
    limit,
    total,
    totalPages,
  };
}

export function paginateItems<T>(items: T[], page: number, limit: number) {
  const pagination = createPaginationMeta(items.length, page, limit);
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;

  return {
    data: items.slice(startIndex, endIndex),
    pagination,
  };
}
