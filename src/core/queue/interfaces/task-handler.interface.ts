export interface ITaskQueueContext {
  jobId: string;
  reportProgress(percent: number): Promise<void>;
}

export interface ITaskHandler {
  readonly handlerKey: string;
  execute(
    payload: Record<string, unknown>,
    ctx: ITaskQueueContext,
  ): Promise<void>;
}
