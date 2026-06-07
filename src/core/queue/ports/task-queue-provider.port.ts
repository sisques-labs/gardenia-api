import { ITaskQueueJob } from '@core/queue/interfaces/task-queue-job.interface';

export const TASK_QUEUE_PROVIDER = Symbol('TASK_QUEUE_PROVIDER');

export interface ITaskQueueProvider {
  enqueue(job: ITaskQueueJob): Promise<string>;
  cancel(queueJobId: string): Promise<void>;
  onModuleInit(): Promise<void>;
  onModuleDestroy(): Promise<void>;
}
