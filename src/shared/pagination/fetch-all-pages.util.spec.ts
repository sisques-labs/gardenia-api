import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { fetchAllPages } from './fetch-all-pages.util';

describe('fetchAllPages', () => {
  it('returns every item from a single short page', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValue(new PaginatedResult(['a', 'b'], 2, 1, 100));

    const result = await fetchAllPages(fetchPage, 100);

    expect(result).toEqual(['a', 'b']);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(1, 100);
  });

  it('returns an empty array when the first page is empty', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValue(new PaginatedResult([], 0, 1, 100));

    const result = await fetchAllPages(fetchPage, 100);

    expect(result).toEqual([]);
  });

  it('keeps fetching until a page comes back shorter than the page size', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(
        new PaginatedResult(new Array(100).fill('x'), 101, 1, 100),
      )
      .mockResolvedValueOnce(new PaginatedResult(['y'], 101, 2, 100));

    const result = await fetchAllPages(fetchPage, 100);

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 100);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 100);
    expect(result).toHaveLength(101);
  });

  it('defaults the page size to 100 when not given', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValue(new PaginatedResult([], 0, 1, 100));

    await fetchAllPages(fetchPage);

    expect(fetchPage).toHaveBeenCalledWith(1, 100);
  });
});
