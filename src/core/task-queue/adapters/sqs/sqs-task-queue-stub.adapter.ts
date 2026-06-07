import { Injectable } from '@nestjs/common';
import { NotImplementedException } from '@nestjs/common';

import { ITaskQueueJob } from '@core/task-queue/interfaces/task-queue-job.interface';
import { ITaskQueueProvider } from '@core/task-queue/ports/task-queue-provider.port';

@Injectable()
export class SqsTaskQueueStubAdapter implements ITaskQueueProvider {
  async enqueue(_job: ITaskQueueJob): Promise<string> {
    throw new NotImplementedException('SQS provider not yet implemented');
  }

  async cancel(_queueJobId: string): Promise<void> {
    throw new NotImplementedException('SQS provider not yet implemented');
  }

  async onModuleInit(): Promise<void> {}

  async onModuleDestroy(): Promise<void> {}
}
