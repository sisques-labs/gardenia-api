import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DiscoveryModule } from '@nestjs/core';

import { TaskHandlerRegistry } from '@core/queue/application/registry/task-handler.registry';
import { TASK_QUEUE_PROVIDER } from '@core/queue/application/ports/task-queue-provider.port';
import { BullMqTaskQueueAdapter } from '@core/queue/infrastructure/adapters/bullmq/bullmq-task-queue.adapter';
import { NoopTaskQueueAdapter } from '@core/queue/infrastructure/adapters/noop/noop-task-queue.adapter';
import { RabbitMqTaskQueueStubAdapter } from '@core/queue/infrastructure/adapters/rabbitmq/rabbitmq-task-queue-stub.adapter';
import { SqsTaskQueueAdapter } from '@core/queue/infrastructure/adapters/sqs/sqs-task-queue.adapter';
import { taskQueueConfig } from '@core/queue/infrastructure/config/queue.config';

@Global()
@Module({
  imports: [
    CqrsModule,
    DiscoveryModule,
    ConfigModule.forFeature(taskQueueConfig),
  ],
  providers: [
    TaskHandlerRegistry,
    BullMqTaskQueueAdapter,
    SqsTaskQueueAdapter,
    RabbitMqTaskQueueStubAdapter,
    NoopTaskQueueAdapter,
    {
      provide: TASK_QUEUE_PROVIDER,
      inject: [
        ConfigService,
        BullMqTaskQueueAdapter,
        SqsTaskQueueAdapter,
        RabbitMqTaskQueueStubAdapter,
        NoopTaskQueueAdapter,
      ],
      useFactory: (
        config: ConfigService,
        bullmq: BullMqTaskQueueAdapter,
        sqs: SqsTaskQueueAdapter,
        rabbitmq: RabbitMqTaskQueueStubAdapter,
        noop: NoopTaskQueueAdapter,
      ) => {
        const provider = config.get<string>('taskQueue.provider', 'redis');
        if (provider === 'sqs') return sqs;
        if (provider === 'rabbitmq') return rabbitmq;
        if (provider === 'noop') return noop;
        return bullmq;
      },
    },
  ],
  exports: [TASK_QUEUE_PROVIDER, TaskHandlerRegistry],
})
export class QueueModule {}
