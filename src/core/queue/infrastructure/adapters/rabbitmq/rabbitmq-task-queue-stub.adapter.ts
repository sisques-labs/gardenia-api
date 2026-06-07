import { Injectable, NotImplementedException } from '@nestjs/common';

import { ITaskQueueJob } from '@core/queue/application/ports/task-queue-provider.port';
import { ITaskQueueProvider } from '@core/queue/application/ports/task-queue-provider.port';

@Injectable()
export class RabbitMqTaskQueueStubAdapter implements ITaskQueueProvider {
  async enqueue(_job: ITaskQueueJob): Promise<string> {
    throw new NotImplementedException('RabbitMQ provider not yet implemented');
  }

  async cancel(_queueJobId: string): Promise<void> {
    throw new NotImplementedException('RabbitMQ provider not yet implemented');
  }

  async onModuleInit(): Promise<void> {}

  async onModuleDestroy(): Promise<void> {}
}
