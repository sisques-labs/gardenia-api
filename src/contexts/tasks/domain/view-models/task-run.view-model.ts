import { ITaskRunPrimitives } from '@contexts/tasks/domain/primitives/task-run.primitives';

export class TaskRunViewModel {
  public readonly id: string;
  public readonly taskId: string;
  public readonly attempt: number;
  public readonly status: string;
  public readonly progress: number;
  public readonly error: string | null;
  public readonly startedAt: Date;
  public readonly endedAt: Date | null;
  public readonly createdAt: Date;

  constructor(props: ITaskRunPrimitives) {
    this.id = props.id;
    this.taskId = props.taskId;
    this.attempt = props.attempt;
    this.status = props.status;
    this.progress = props.progress;
    this.error = props.error;
    this.startedAt = props.startedAt;
    this.endedAt = props.endedAt;
    this.createdAt = props.createdAt;
  }
}
