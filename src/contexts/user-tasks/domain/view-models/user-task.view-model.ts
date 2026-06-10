import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IUserTaskPrimitives } from '@contexts/user-tasks/domain/primitives/user-task.primitives';

export class UserTaskViewModel extends BaseViewModel {
  public readonly title: string;
  public readonly description: string | null;
  public readonly status: string;
  public readonly scheduledDate: Date;
  public readonly taskTemplateId: string | null;
  public readonly userId: string;
  public readonly completedAt: Date | null;

  constructor(props: IUserTaskPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.title = props.title;
    this.description = props.description;
    this.status = props.status;
    this.scheduledDate = props.scheduledDate;
    this.taskTemplateId = props.taskTemplateId;
    this.userId = props.userId;
    this.completedAt = props.completedAt;
  }
}
