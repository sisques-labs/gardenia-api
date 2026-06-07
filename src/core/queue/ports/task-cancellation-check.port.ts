export const TASK_CANCELLATION_CHECK_PORT = Symbol('TASK_CANCELLATION_CHECK_PORT');

export interface ITaskCancellationCheckPort {
  isCancelled(taskId: string): Promise<boolean>;
}
