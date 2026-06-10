import { Injectable } from '@nestjs/common';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  ITaskQueueJob,
  ITaskQueueProvider,
} from '@core/queue/application/ports/task-queue-provider.port';

@Injectable()
export class NoopTaskQueueAdapter implements ITaskQueueProvider {
  async enqueue(_job: ITaskQueueJob): Promise<string> {
    return UuidValueObject.generate().value;
  }

  async cancel(_queueJobId: string): Promise<void> {}

  async onModuleInit(): Promise<void> {}

  async onModuleDestroy(): Promise<void> {}
}
