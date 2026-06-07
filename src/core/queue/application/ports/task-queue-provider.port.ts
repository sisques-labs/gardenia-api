export const TASK_QUEUE_PROVIDER = Symbol('TASK_QUEUE_PROVIDER');

export interface ITaskQueueJob {
  taskId: string;
  handlerKey: string;
  payload: Record<string, unknown>;
  priority: number;
  timeoutMs: number;
  delayMs?: number;
  cronExpression?: string;
  retryCount?: number;
  backoffStrategy?: string;
  validUntil?: Date;
}

export interface ITaskQueueProvider {
  enqueue(job: ITaskQueueJob): Promise<string>;
  cancel(queueJobId: string): Promise<void>;
  onModuleInit(): Promise<void>;
  onModuleDestroy(): Promise<void>;
}
