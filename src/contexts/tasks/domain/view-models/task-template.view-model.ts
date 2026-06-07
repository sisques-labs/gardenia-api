import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { ITaskTemplatePrimitives } from '@contexts/tasks/domain/primitives/task-template.primitives';

export class TaskTemplateViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly description: string | null;
  public readonly handlerKey: string;
  public readonly defaultPriority: number;
  public readonly defaultRetryCount: number;
  public readonly defaultBackoffStrategy: string;
  public readonly defaultTimeoutMs: number;
  public readonly maxConcurrency: number;
  public readonly defaultCronExpression: string | null;
  public readonly defaultIsRecurring: boolean;
  public readonly userId: string;

  constructor(props: ITaskTemplatePrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.description = props.description;
    this.handlerKey = props.handlerKey;
    this.defaultPriority = props.defaultPriority;
    this.defaultRetryCount = props.defaultRetryCount;
    this.defaultBackoffStrategy = props.defaultBackoffStrategy;
    this.defaultTimeoutMs = props.defaultTimeoutMs;
    this.maxConcurrency = props.maxConcurrency;
    this.defaultCronExpression = props.defaultCronExpression;
    this.defaultIsRecurring = props.defaultIsRecurring;
    this.userId = props.userId;
  }
}
