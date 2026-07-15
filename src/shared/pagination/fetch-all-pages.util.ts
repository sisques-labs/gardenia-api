import { PaginatedResult } from '@sisques-labs/nestjs-kit';

const DEFAULT_PAGE_SIZE = 100;

/**
 * Pages through a PaginatedResult-returning fetcher until a page comes back
 * shorter than the page size, collecting every item. Used by every "sweep
 * everything" cron/adapter (across contexts) that needs the full result set
 * rather than one page of it.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, perPage: number) => Promise<PaginatedResult<T>>,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  for (;;) {
    const result = await fetchPage(page, pageSize);
    results.push(...result.items);
    if (result.items.length < pageSize) break;
    page += 1;
  }

  return results;
}
