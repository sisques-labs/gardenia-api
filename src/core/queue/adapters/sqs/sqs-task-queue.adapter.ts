import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';

import {
  TaskJobCompletedEvent,
  TaskJobFailedEvent,
  TaskJobProgressEvent,
  TaskJobStartedEvent,
} from '@core/queue/events/task-job-lifecycle.events';
import { ITaskQueueContext } from '@core/queue/interfaces/task-handler.interface';
import { ITaskQueueJob } from '@core/queue/interfaces/task-queue-job.interface';
import {
  ITaskCancellationCheckPort,
  TASK_CANCELLATION_CHECK_PORT,
} from '@core/queue/ports/task-cancellation-check.port';
import { ITaskQueueProvider } from '@core/queue/ports/task-queue-provider.port';
import { TaskHandlerRegistry } from '@core/queue/registry/task-handler.registry';

@Injectable()
export class SqsTaskQueueAdapter
  implements ITaskQueueProvider, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SqsTaskQueueAdapter.name);
  private client!: SQSClient;
  private queueUrl!: string;
  private polling = false;

  // SQS has no delete-by-id before receipt. We track cancelled message IDs
  // in memory and skip them when dequeued. Caveat: if the process restarts,
  // the in-memory set is lost and the message will be processed once before
  // being skipped next time (if still in flight).
  private readonly cancelledMessageIds = new Set<string>();
  // Resolved lazily in onModuleInit to avoid circular module dependencies.
  private cancellationCheck: ITaskCancellationCheckPort | null = null;

  constructor(
    private readonly registry: TaskHandlerRegistry,
    private readonly eventBus: EventBus,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit(): Promise<void> {
    const region = this.configService.get<string>('taskQueue.sqs.region', 'us-east-1');
    const accessKeyId = this.configService.get<string>('taskQueue.sqs.accessKeyId');
    const secretAccessKey = this.configService.get<string>('taskQueue.sqs.secretAccessKey');

    this.queueUrl = this.configService.getOrThrow<string>('taskQueue.sqs.queueUrl');

    this.client = new SQSClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });

    // Lazily resolve the cancellation check port to avoid circular module deps
    // (QueueModule → TasksModule → TASK_QUEUE_PROVIDER from QueueModule).
    try {
      this.cancellationCheck = this.moduleRef.get<ITaskCancellationCheckPort>(
        TASK_CANCELLATION_CHECK_PORT,
        { strict: false },
      );
    } catch {
      this.logger.debug('TaskCancellationCheckPort not registered; skipping DB cancel check');
    }

    this.polling = true;
    void this.poll();
    this.logger.log(`SQS consumer started on ${this.queueUrl}`);
  }

  async onModuleDestroy(): Promise<void> {
    this.polling = false;
    this.client.destroy();
  }

  async enqueue(job: ITaskQueueJob): Promise<string> {
    if (job.cronExpression) {
      this.logger.warn(
        `SQS does not support cron expressions natively. ` +
        `Task ${job.taskId} will be enqueued once. ` +
        `Use EventBridge Scheduler for recurring jobs.`,
      );
    }

    const result = await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify({
          taskId: job.taskId,
          handlerKey: job.handlerKey,
          payload: job.payload,
        }),
        // SQS delay supports up to 900 seconds (15 minutes)
        DelaySeconds: job.delayMs
          ? Math.min(Math.floor(job.delayMs / 1000), 900)
          : undefined,
        MessageAttributes: {
          priority: { DataType: 'Number', StringValue: String(job.priority) },
          retryCount: {
            DataType: 'Number',
            StringValue: String(job.retryCount ?? 3),
          },
        },
      }),
    );

    return result.MessageId ?? job.taskId;
  }

  async cancel(queueJobId: string): Promise<void> {
    // Mark as cancelled. The consumer will skip the message when it dequeues it.
    // If the task is already ACTIVE (being processed), this has no effect.
    this.cancelledMessageIds.add(queueJobId);
  }

  private async poll(): Promise<void> {
    while (this.polling) {
      try {
        const result = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
            MessageSystemAttributeNames: ['ApproximateReceiveCount'],
            MessageAttributeNames: ['All'],
            VisibilityTimeout: 30,
          }),
        );

        const messages = result.Messages ?? [];
        await Promise.all(messages.map((msg) => this.processMessage(msg)));
      } catch (err) {
        if (this.polling) {
          this.logger.error('SQS poll error', err);
          await new Promise((r) => setTimeout(r, 5_000));
        }
      }
    }
  }

  private async processMessage(message: Message): Promise<void> {
    const receiptHandle = message.ReceiptHandle!;
    const messageId = message.MessageId ?? '';

    let body: { taskId: string; handlerKey: string; payload: Record<string, unknown> };
    try {
      body = JSON.parse(message.Body ?? '{}');
    } catch {
      this.logger.error(`Unparseable SQS message body, discarding: ${message.Body}`);
      await this.deleteMessage(receiptHandle);
      return;
    }

    const { taskId, handlerKey, payload } = body;

    if (this.cancelledMessageIds.has(messageId)) {
      this.logger.log(`Skipping cancelled task ${taskId} (messageId: ${messageId})`);
      this.cancelledMessageIds.delete(messageId);
      await this.deleteMessage(receiptHandle);
      return;
    }

    // Secondary DB check — catches cancellations that survived a process restart
    if (this.cancellationCheck && await this.cancellationCheck.isCancelled(taskId)) {
      this.logger.log(`Skipping DB-cancelled task ${taskId} (messageId: ${messageId})`);
      await this.deleteMessage(receiptHandle);
      return;
    }

    const receiveCount = parseInt(
      message.Attributes?.ApproximateReceiveCount ?? '1',
      10,
    );
    const maxRetries = parseInt(
      message.MessageAttributes?.retryCount?.StringValue ?? '3',
      10,
    );

    this.logger.log(
      `Processing task ${taskId} with handler '${handlerKey}' ` +
      `(attempt ${receiveCount}/${maxRetries + 1})`,
    );

    this.eventBus.publish(new TaskJobStartedEvent(taskId, messageId));

    const ctx: ITaskQueueContext = {
      jobId: messageId,
      reportProgress: async (percent: number) => {
        this.eventBus.publish(new TaskJobProgressEvent(taskId, percent));
      },
    };

    try {
      await this.registry.dispatch(handlerKey, payload, ctx);
      await this.deleteMessage(receiptHandle);
      this.eventBus.publish(new TaskJobCompletedEvent(taskId));
      this.logger.log(`Task ${taskId} completed`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const isFinal = receiveCount > maxRetries;
      this.logger.error(`Task ${taskId} failed (isFinal=${isFinal}): ${error}`);
      this.eventBus.publish(new TaskJobFailedEvent(taskId, error, isFinal));
      // Do not delete — SQS will make the message visible again after
      // VisibilityTimeout. When ApproximateReceiveCount exceeds the queue's
      // maxReceiveCount (redrive policy), SQS automatically moves it to the DLQ.
    }
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
  }
}
