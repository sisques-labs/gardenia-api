import { registerAs } from '@nestjs/config';

export const taskQueueConfig = registerAs('taskQueue', () => {
  const provider = process.env.TASK_PROVIDER ?? 'redis';
  const redisUrl = process.env.TASK_REDIS_URL ?? 'redis://localhost:6379';
  const ttlRaw = parseInt(
    process.env.TASK_IDEMPOTENCY_TTL_SECONDS ?? '3600',
    10,
  );
  const idempotencyTtlSeconds = ttlRaw > 0 ? ttlRaw : 3600;

  return { provider, redisUrl, idempotencyTtlSeconds };
});
