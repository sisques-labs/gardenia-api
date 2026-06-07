import { registerAs } from '@nestjs/config';

export const taskQueueConfig = registerAs('taskQueue', () => {
  const provider = process.env.TASK_PROVIDER ?? 'redis';
  const redisUrl = process.env.TASK_REDIS_URL ?? 'redis://localhost:6379';
  const ttlRaw = parseInt(
    process.env.TASK_IDEMPOTENCY_TTL_SECONDS ?? '3600',
    10,
  );
  const idempotencyTtlSeconds = ttlRaw > 0 ? ttlRaw : 3600;

  return {
    provider,
    redisUrl,
    idempotencyTtlSeconds,
    sqs: {
      region: process.env.TASK_SQS_REGION ?? 'us-east-1',
      queueUrl: process.env.TASK_SQS_QUEUE_URL ?? '',
      accessKeyId: process.env.TASK_SQS_ACCESS_KEY_ID,
      secretAccessKey: process.env.TASK_SQS_SECRET_ACCESS_KEY,
    },
  };
});
