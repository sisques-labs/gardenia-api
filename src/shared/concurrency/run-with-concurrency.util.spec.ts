import { runWithConcurrency } from './run-with-concurrency.util';

describe('runWithConcurrency', () => {
  it('runs the worker for every item', async () => {
    const seen: number[] = [];

    await runWithConcurrency(
      [1, 2, 3, 4, 5],
      async (item) => {
        seen.push(item);
      },
      2,
    );

    expect(seen.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('never runs more than the given concurrency at once', async () => {
    let active = 0;
    let maxActive = 0;

    await runWithConcurrency(
      Array.from({ length: 10 }, (_, i) => i),
      async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
      },
      3,
    );

    expect(maxActive).toBeLessThanOrEqual(3);
  });

  it('does nothing for an empty list', async () => {
    const worker = jest.fn();
    await runWithConcurrency([], worker, 5);
    expect(worker).not.toHaveBeenCalled();
  });

  it('propagates a worker error', async () => {
    await expect(
      runWithConcurrency(
        [1, 2, 3],
        async (item) => {
          if (item === 2) throw new Error('boom');
        },
        2,
      ),
    ).rejects.toThrow('boom');
  });
});
