/**
 * Runs `worker` over every item with at most `concurrency` calls in flight
 * at once — a dependency-free worker-pool for "process N items, but don't
 * fire N unbounded concurrent requests" cron/sweep loops.
 */
export async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency: number,
): Promise<void> {
  let index = 0;

  async function runNext(): Promise<void> {
    const current = index++;
    if (current >= items.length) return;
    await worker(items[current]);
    return runNext();
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runNext()));
}
