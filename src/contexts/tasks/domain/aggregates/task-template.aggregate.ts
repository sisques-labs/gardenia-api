import { BaseAggregate } from '@sisques-labs/nestjs-kit';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { ITaskTemplateEventData } from '@contexts/tasks/domain/events/interfaces/task-event-data.interface';
import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';
import { ITaskTemplate } from '@contexts/tasks/domain/interfaces/task-template.interface';
import { ITaskTemplatePrimitives } from '@contexts/tasks/domain/primitives/task-template.primitives';
import { TaskBackoffStrategyValueObject } from '@contexts/tasks/domain/value-objects/task-backoff-strategy/task-backoff-strategy.value-object';
import { TaskConcurrencyValueObject } from '@contexts/tasks/domain/value-objects/task-concurrency/task-concurrency.value-object';
import { TaskHandlerKeyValueObject } from '@contexts/tasks/domain/value-objects/task-handler-key/task-handler-key.value-object';
import { TaskNameValueObject } from '@contexts/tasks/domain/value-objects/task-name/task-name.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskRetryCountValueObject } from '@contexts/tasks/domain/value-objects/task-retry-count/task-retry-count.value-object';
import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';
import { TaskTimeoutValueObject } from '@contexts/tasks/domain/value-objects/task-timeout/task-timeout.value-object';

class TaskTemplateCreatedEvent extends BaseEvent<ITaskTemplateEventData> {
  constructor(metadata: IEventMetadata, data: ITaskTemplateEventData) {
    super(metadata, data);
  }
}

class TaskTemplateUpdatedEvent extends BaseEvent<ITaskTemplateEventData> {
  constructor(metadata: IEventMetadata, data: ITaskTemplateEventData) {
    super(metadata, data);
  }
}

export class TaskTemplateAggregate extends BaseAggregate {
  private readonly _id: TaskTemplateIdValueObject;
  private _name: TaskNameValueObject;
  private _description: string | null;
  private _handlerKey: TaskHandlerKeyValueObject;
  private _defaultPriority: TaskPriorityValueObject;
  private _defaultRetryCount: TaskRetryCountValueObject;
  private _defaultBackoffStrategy: TaskBackoffStrategyValueObject;
  private _defaultTimeoutMs: TaskTimeoutValueObject;
  private _maxConcurrency: TaskConcurrencyValueObject;
  private _defaultCronExpression: string | null;
  private _defaultIsRecurring: boolean;
  private readonly _userId: UuidValueObject;

  constructor(props: ITaskTemplate) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._name = props.name;
    this._description = props.description;
    this._handlerKey = props.handlerKey;
    this._defaultPriority = props.defaultPriority;
    this._defaultRetryCount = props.defaultRetryCount;
    this._defaultBackoffStrategy = props.defaultBackoffStrategy;
    this._defaultTimeoutMs = props.defaultTimeoutMs;
    this._maxConcurrency = props.maxConcurrency;
    this._defaultCronExpression = props.defaultCronExpression;
    this._defaultIsRecurring = props.defaultIsRecurring;
    this._userId = props.userId;
  }

  public create(): void {
    this.apply(
      new TaskTemplateCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskTemplateAggregate.name,
          entityId: this._id.value,
          entityType: TaskTemplateAggregate.name,
          eventType: TaskTemplateCreatedEvent.name,
        },
        {
          id: this._id.value,
          name: this._name.value,
          handlerKey: this._handlerKey.value,
          userId: this._userId.value,
        },
      ),
    );
  }

  public update(
    props: Partial<
      Pick<
        ITaskTemplate,
        | 'name'
        | 'description'
        | 'handlerKey'
        | 'defaultPriority'
        | 'defaultRetryCount'
        | 'defaultBackoffStrategy'
        | 'defaultTimeoutMs'
        | 'maxConcurrency'
        | 'defaultCronExpression'
        | 'defaultIsRecurring'
      >
    >,
  ): void {
    if (props.name) this._name = props.name;
    if (props.description !== undefined) this._description = props.description;
    if (props.handlerKey) this._handlerKey = props.handlerKey;
    if (props.defaultPriority) this._defaultPriority = props.defaultPriority;
    if (props.defaultRetryCount) this._defaultRetryCount = props.defaultRetryCount;
    if (props.defaultBackoffStrategy) this._defaultBackoffStrategy = props.defaultBackoffStrategy;
    if (props.defaultTimeoutMs) this._defaultTimeoutMs = props.defaultTimeoutMs;
    if (props.maxConcurrency) this._maxConcurrency = props.maxConcurrency;
    if (props.defaultCronExpression !== undefined) this._defaultCronExpression = props.defaultCronExpression;
    if (props.defaultIsRecurring !== undefined) this._defaultIsRecurring = props.defaultIsRecurring;

    this.touch();

    this.apply(
      new TaskTemplateUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskTemplateAggregate.name,
          entityId: this._id.value,
          entityType: TaskTemplateAggregate.name,
          eventType: TaskTemplateUpdatedEvent.name,
        },
        {
          id: this._id.value,
          name: this._name.value,
          handlerKey: this._handlerKey.value,
          userId: this._userId.value,
        },
      ),
    );
  }

  get id(): TaskTemplateIdValueObject {
    return this._id;
  }

  get name(): TaskNameValueObject {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get handlerKey(): TaskHandlerKeyValueObject {
    return this._handlerKey;
  }

  get defaultPriority(): TaskPriorityValueObject {
    return this._defaultPriority;
  }

  get defaultRetryCount(): TaskRetryCountValueObject {
    return this._defaultRetryCount;
  }

  get defaultBackoffStrategy(): TaskBackoffStrategyValueObject {
    return this._defaultBackoffStrategy;
  }

  get defaultTimeoutMs(): TaskTimeoutValueObject {
    return this._defaultTimeoutMs;
  }

  get maxConcurrency(): TaskConcurrencyValueObject {
    return this._maxConcurrency;
  }

  get defaultCronExpression(): string | null {
    return this._defaultCronExpression;
  }

  get defaultIsRecurring(): boolean {
    return this._defaultIsRecurring;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  toPrimitives(): ITaskTemplatePrimitives {
    return {
      id: this._id.value,
      name: this._name.value,
      description: this._description,
      handlerKey: this._handlerKey.value,
      defaultPriority: this._defaultPriority.value,
      defaultRetryCount: this._defaultRetryCount.value,
      defaultBackoffStrategy: this._defaultBackoffStrategy.value,
      defaultTimeoutMs: this._defaultTimeoutMs.value,
      maxConcurrency: this._maxConcurrency.value,
      defaultCronExpression: this._defaultCronExpression,
      defaultIsRecurring: this._defaultIsRecurring,
      userId: this._userId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
