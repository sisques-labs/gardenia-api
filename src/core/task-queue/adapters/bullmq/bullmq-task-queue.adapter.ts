import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { Job, Queue, Worker } from 'bullmq';

import { ITaskQueueContext } from '@core/task-queue/interfaces/task-handler.interface';
import { ITaskQueueJob } from '@core/task-queue/interfaces/task-queue-job.interface';
import { ITaskQueueProvider } from '@core/task-queue/ports/task-queue-provider.port';
import { TaskHandlerRegistry } from '@core/task-queue/registry/task-handler.registry';

export class TaskJobStartedEvent {
  constructor(
    public readonly taskId: string,
    public readonly queueJobId: string,
  ) {}
}

export class TaskJobCompletedEvent {
  constructor(public readonly taskId: string) {}
}

export class TaskJobFailedEvent {
  constructor(
    public readonly taskId: string,
    public readonly error: string,
    public readonly isFinal: boolean,
  ) {}
}

export class TaskJobProgressEvent {
  constructor(
    public readonly taskId: string,
    public readonly progress: number,
  ) {}
}

@Injectable()
export class BullMqTaskQueueAdapter
  implements ITaskQueueProvider, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BullMqTaskQueueAdapter.name);
  private queue!: Queue;
  private dlqQueue!: Queue;
  private worker!: Worker;

  constructor(
    private readonly registry: TaskHandlerRegistry,
    private readonly eventBus: EventBus,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>(
      'taskQueue.redisUrl',
      'redis://localhost:6379',
    );

    const parsed = new URL(redisUrl);
    const connectionOpts = {
      connection: {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
        password: parsed.password || undefined,
        maxRetriesPerRequest: null as null,
      },
    };

    this.queue = new Queue('tasks-main', connectionOpts);
    this.dlqQueue = new Queue('tasks-dlq', connectionOpts);

    this.worker = new Worker(
      'tasks-main',
      async (job: Job) => this.processJob(job),
      { ...connectionOpts, concurrency: 10 },
    );

    this.worker.on('failed', async (job, err) => {
      if (!job) return;
      const taskId: string = job.data.taskId;
      const isFinal = job.attemptsMade >= (job.opts.attempts ?? 1);

      this.eventBus.publish(
        new TaskJobFailedEvent(taskId, err.message, isFinal),
      );

      if (isFinal) {
        await this.dlqQueue.add('failed-task', job.data, { removeOnComplete: false });
        this.logger.warn(`Task ${taskId} sent to DLQ after ${job.attemptsMade} attempts`);
      }
    });

    this.logger.log('BullMQ worker started on queue tasks-main');
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    await this.dlqQueue?.close();
  }

  async enqueue(job: ITaskQueueJob): Promise<string> {
    const attempts = (job.retryCount ?? 3) + 1;
    const backoffType =
      job.backoffStrategy === 'fixed'
        ? 'fixed'
        : job.backoffStrategy === 'linear'
          ? 'fixed'
          : 'exponential';

    const bullJob = await this.queue.add(
      job.handlerKey,
      { taskId: job.taskId, handlerKey: job.handlerKey, payload: job.payload },
      {
        priority: 11 - job.priority,
        delay: job.delayMs,
        repeat: job.cronExpression ? { pattern: job.cronExpression } : undefined,
        attempts,
        backoff: { type: backoffType, delay: 1000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: false,
        jobId: job.cronExpression ? `cron:${job.taskId}` : undefined,
      },
    );

    return String(bullJob.id ?? bullJob.opts?.jobId ?? job.taskId);
  }

  async cancel(queueJobId: string): Promise<void> {
    const job = await this.queue.getJob(queueJobId);
    if (job) {
      await job.remove();
    }
  }

  private async processJob(job: Job): Promise<void> {
    const { taskId, handlerKey, payload } = job.data as {
      taskId: string;
      handlerKey: string;
      payload: Record<string, unknown>;
    };

    this.logger.log(`Processing task ${taskId} with handler '${handlerKey}'`);

    this.eventBus.publish(new TaskJobStartedEvent(taskId, String(job.id)));

    const ctx: ITaskQueueContext = {
      jobId: String(job.id),
      reportProgress: async (percent: number) => {
        await job.updateProgress(percent);
        this.eventBus.publish(new TaskJobProgressEvent(taskId, percent));
      },
    };

    await this.registry.dispatch(handlerKey, payload, ctx);

    this.eventBus.publish(new TaskJobCompletedEvent(taskId));
    this.logger.log(`Task ${taskId} completed`);
  }
}
