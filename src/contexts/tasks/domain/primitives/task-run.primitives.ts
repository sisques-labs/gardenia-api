export interface ITaskRunPrimitives {
  id: string;
  taskId: string;
  attempt: number;
  status: string;
  progress: number;
  error: string | null;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
}
