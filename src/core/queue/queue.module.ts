import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DiscoveryModule } from '@nestjs/core';

import { BullMqTaskQueueAdapter } from '@core/queue/adapters/bullmq/bullmq-task-queue.adapter';
import { RabbitMqTaskQueueStubAdapter } from '@core/queue/adapters/rabbitmq/rabbitmq-task-queue-stub.adapter';
import { SqsTaskQueueStubAdapter } from '@core/queue/adapters/sqs/sqs-task-queue-stub.adapter';
import { taskQueueConfig } from '@core/queue/config/queue.config';
import { TASK_QUEUE_PROVIDER } from '@core/queue/ports/task-queue-provider.port';
import { TaskHandlerRegistry } from '@core/queue/registry/task-handler.registry';

@Global()
@Module({
  imports: [CqrsModule, DiscoveryModule, ConfigModule.forFeature(taskQueueConfig)],
  providers: [
    TaskHandlerRegistry,
    BullMqTaskQueueAdapter,
    SqsTaskQueueStubAdapter,
    RabbitMqTaskQueueStubAdapter,
    {
      provide: TASK_QUEUE_PROVIDER,
      inject: [ConfigService, BullMqTaskQueueAdapter, SqsTaskQueueStubAdapter, RabbitMqTaskQueueStubAdapter],
      useFactory: (
        config: ConfigService,
        bullmq: BullMqTaskQueueAdapter,
        sqs: SqsTaskQueueStubAdapter,
        rabbitmq: RabbitMqTaskQueueStubAdapter,
      ) => {
        const provider = config.get<string>('taskQueue.provider', 'redis');
        if (provider === 'sqs') return sqs;
        if (provider === 'rabbitmq') return rabbitmq;
        return bullmq;
      },
    },
  ],
  exports: [TASK_QUEUE_PROVIDER, TaskHandlerRegistry],
})
export class QueueModule {}
