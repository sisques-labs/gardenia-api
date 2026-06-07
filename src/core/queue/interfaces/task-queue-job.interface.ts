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
}
