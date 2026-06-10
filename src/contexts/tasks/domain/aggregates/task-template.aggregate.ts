import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskTemplateDefaultBackoffStrategyChangedEvent } from '@contexts/tasks/domain/events/field-changed/default-backoff-strategy-changed/task-template-default-backoff-strategy-changed.event';
import { TaskTemplateDefaultCronExpressionChangedEvent } from '@contexts/tasks/domain/events/field-changed/default-cron-expression-changed/task-template-default-cron-expression-changed.event';
import { TaskTemplateDefaultIsRecurringChangedEvent } from '@contexts/tasks/domain/events/field-changed/default-is-recurring-changed/task-template-default-is-recurring-changed.event';
import { TaskTemplateDefaultPriorityChangedEvent } from '@contexts/tasks/domain/events/field-changed/default-priority-changed/task-template-default-priority-changed.event';
import { TaskTemplateDefaultRetryCountChangedEvent } from '@contexts/tasks/domain/events/field-changed/default-retry-count-changed/task-template-default-retry-count-changed.event';
import { TaskTemplateDefaultTimeoutMsChangedEvent } from '@contexts/tasks/domain/events/field-changed/default-timeout-ms-changed/task-template-default-timeout-ms-changed.event';
import { TaskTemplateDescriptionChangedEvent } from '@contexts/tasks/domain/events/field-changed/description-changed/task-template-description-changed.event';
import { TaskTemplateHandlerKeyChangedEvent } from '@contexts/tasks/domain/events/field-changed/handler-key-changed/task-template-handler-key-changed.event';
import { TaskTemplateMaxConcurrencyChangedEvent } from '@contexts/tasks/domain/events/field-changed/max-concurrency-changed/task-template-max-concurrency-changed.event';
import { TaskTemplateNameChangedEvent } from '@contexts/tasks/domain/events/field-changed/name-changed/task-template-name-changed.event';
import { TaskTemplateCreatedEvent } from '@contexts/tasks/domain/events/task-template-created/task-template-created.event';
import { TaskTemplateDeletedEvent } from '@contexts/tasks/domain/events/task-template-deleted/task-template-deleted.event';
import { TaskTemplateUpdatedEvent } from '@contexts/tasks/domain/events/task-template-updated/task-template-updated.event';
import { ITaskTemplate } from '@contexts/tasks/domain/interfaces/task-template.interface';
import { ITaskTemplatePrimitives } from '@contexts/tasks/domain/primitives/task-template.primitives';
import { TaskBackoffStrategyValueObject } from '@contexts/tasks/domain/value-objects/task-backoff-strategy/task-backoff-strategy.value-object';
import { TaskConcurrencyValueObject } from '@contexts/tasks/domain/value-objects/task-concurrency/task-concurrency.value-object';
import { TaskCronExpressionValueObject } from '@contexts/tasks/domain/value-objects/task-cron-expression/task-cron-expression.value-object';
import { TaskDescriptionValueObject } from '@contexts/tasks/domain/value-objects/task-description/task-description.value-object';
import { TaskHandlerKeyValueObject } from '@contexts/tasks/domain/value-objects/task-handler-key/task-handler-key.value-object';
import { TaskIsRecurringValueObject } from '@contexts/tasks/domain/value-objects/task-is-recurring/task-is-recurring.value-object';
import { TaskNameValueObject } from '@contexts/tasks/domain/value-objects/task-name/task-name.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskRetryCountValueObject } from '@contexts/tasks/domain/value-objects/task-retry-count/task-retry-count.value-object';
import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';
import { TaskTimeoutValueObject } from '@contexts/tasks/domain/value-objects/task-timeout/task-timeout.value-object';

export class TaskTemplateAggregate extends BaseAggregate {
  private readonly _id: TaskTemplateIdValueObject;
  private _name: TaskNameValueObject;
  private _description: TaskDescriptionValueObject | null;
  private _handlerKey: TaskHandlerKeyValueObject | null;
  private _defaultPriority: TaskPriorityValueObject;
  private _defaultRetryCount: TaskRetryCountValueObject;
  private _defaultBackoffStrategy: TaskBackoffStrategyValueObject;
  private _defaultTimeoutMs: TaskTimeoutValueObject;
  private _maxConcurrency: TaskConcurrencyValueObject;
  private _defaultCronExpression: TaskCronExpressionValueObject | null;
  private _defaultIsRecurring: TaskIsRecurringValueObject;
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
        this.toPrimitives(),
      ),
    );
  }

  public update(
    props: Omit<
      Partial<ITaskTemplate>,
      'id' | 'userId' | 'createdAt' | 'updatedAt'
    >,
  ): void {
    if (props.name !== undefined) {
      this.changeName(props.name);
    }

    if (props.description !== undefined) {
      this.changeDescription(props.description);
    }

    if ('handlerKey' in props) {
      this.changeHandlerKey(props.handlerKey ?? null);
    }

    if (props.defaultPriority !== undefined) {
      this.changeDefaultPriority(props.defaultPriority);
    }

    if (props.defaultRetryCount !== undefined) {
      this.changeDefaultRetryCount(props.defaultRetryCount);
    }

    if (props.defaultBackoffStrategy !== undefined) {
      this.changeDefaultBackoffStrategy(props.defaultBackoffStrategy);
    }

    if (props.defaultTimeoutMs !== undefined) {
      this.changeDefaultTimeoutMs(props.defaultTimeoutMs);
    }

    if (props.maxConcurrency !== undefined) {
      this.changeMaxConcurrency(props.maxConcurrency);
    }

    if (props.defaultCronExpression !== undefined) {
      this.changeDefaultCronExpression(props.defaultCronExpression);
    }

    if (props.defaultIsRecurring !== undefined) {
      this.changeDefaultIsRecurring(props.defaultIsRecurring);
    }

    this.apply(
      new TaskTemplateUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskTemplateAggregate.name,
          entityId: this._id.value,
          entityType: TaskTemplateAggregate.name,
          eventType: TaskTemplateUpdatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public delete(): void {
    this.apply(
      new TaskTemplateDeletedEvent(
        this.eventMetadata(TaskTemplateDeletedEvent.name),
        { taskTemplateId: this._id.value },
      ),
    );
  }

  private changeName(newName: TaskNameValueObject): void {
    const oldValue = this._name.value;
    const newValue = newName.value;
    if (oldValue === newValue) return;
    this._name = newName;
    this.touch();
    this.apply(
      new TaskTemplateNameChangedEvent(
        this.eventMetadata(TaskTemplateNameChangedEvent.name),
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeDescription(
    newDescription: TaskDescriptionValueObject | null,
  ): void {
    const oldValue = this._description?.value ?? null;
    const newValue = newDescription?.value ?? null;
    if (oldValue === newValue) return;
    this._description = newDescription;
    this.touch();
    this.apply(
      new TaskTemplateDescriptionChangedEvent(
        this.eventMetadata(TaskTemplateDescriptionChangedEvent.name),
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeHandlerKey(
    newHandlerKey: TaskHandlerKeyValueObject | null,
  ): void {
    const oldValue = this._handlerKey?.value ?? null;
    const newValue = newHandlerKey?.value ?? null;
    if (oldValue === newValue) return;
    this._handlerKey = newHandlerKey;
    this.touch();
    this.apply(
      new TaskTemplateHandlerKeyChangedEvent(
        this.eventMetadata(TaskTemplateHandlerKeyChangedEvent.name),
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeDefaultPriority(newPriority: TaskPriorityValueObject): void {
    const oldValue = this._defaultPriority.value;
    const newValue = newPriority.value;
    if (oldValue === newValue) return;
    this._defaultPriority = newPriority;
    this.touch();
    this.apply(
      new TaskTemplateDefaultPriorityChangedEvent(
        this.eventMetadata(TaskTemplateDefaultPriorityChangedEvent.name),
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeDefaultRetryCount(
    newRetryCount: TaskRetryCountValueObject,
  ): void {
    const oldValue = this._defaultRetryCount.value;
    const newValue = newRetryCount.value;
    if (oldValue === newValue) return;
    this._defaultRetryCount = newRetryCount;
    this.touch();
    this.apply(
      new TaskTemplateDefaultRetryCountChangedEvent(
        this.eventMetadata(TaskTemplateDefaultRetryCountChangedEvent.name),
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeDefaultBackoffStrategy(
    newStrategy: TaskBackoffStrategyValueObject,
  ): void {
    const oldValue = this._defaultBackoffStrategy.value;
    const newValue = newStrategy.value;
    if (oldValue === newValue) return;
    this._defaultBackoffStrategy = newStrategy;
    this.touch();
    this.apply(
      new TaskTemplateDefaultBackoffStrategyChangedEvent(
        this.eventMetadata(TaskTemplateDefaultBackoffStrategyChangedEvent.name),
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeDefaultTimeoutMs(newTimeout: TaskTimeoutValueObject): void {
    const oldValue = this._defaultTimeoutMs.value;
    const newValue = newTimeout.value;
    if (oldValue === newValue) return;
    this._defaultTimeoutMs = newTimeout;
    this.touch();
    this.apply(
      new TaskTemplateDefaultTimeoutMsChangedEvent(
        this.eventMetadata(TaskTemplateDefaultTimeoutMsChangedEvent.name),
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeMaxConcurrency(
    newConcurrency: TaskConcurrencyValueObject,
  ): void {
    const oldValue = this._maxConcurrency.value;
    const newValue = newConcurrency.value;
    if (oldValue === newValue) return;
    this._maxConcurrency = newConcurrency;
    this.touch();
    this.apply(
      new TaskTemplateMaxConcurrencyChangedEvent(
        this.eventMetadata(TaskTemplateMaxConcurrencyChangedEvent.name),
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeDefaultCronExpression(
    newCronExpression: TaskCronExpressionValueObject | null,
  ): void {
    const oldValue = this._defaultCronExpression?.value ?? null;
    const newValue = newCronExpression?.value ?? null;
    if (oldValue === newValue) return;
    this._defaultCronExpression = newCronExpression;
    this.touch();
    this.apply(
      new TaskTemplateDefaultCronExpressionChangedEvent(
        this.eventMetadata(TaskTemplateDefaultCronExpressionChangedEvent.name),
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeDefaultIsRecurring(
    newIsRecurring: TaskIsRecurringValueObject,
  ): void {
    const oldValue = this._defaultIsRecurring.value;
    const newValue = newIsRecurring.value;
    if (oldValue === newValue) return;
    this._defaultIsRecurring = newIsRecurring;
    this.touch();
    this.apply(
      new TaskTemplateDefaultIsRecurringChangedEvent(
        this.eventMetadata(TaskTemplateDefaultIsRecurringChangedEvent.name),
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private eventMetadata(eventType: string) {
    return {
      aggregateRootId: this._id.value,
      aggregateRootType: TaskTemplateAggregate.name,
      entityId: this._id.value,
      entityType: TaskTemplateAggregate.name,
      eventType,
    };
  }

  get id(): TaskTemplateIdValueObject {
    return this._id;
  }

  get name(): TaskNameValueObject {
    return this._name;
  }

  get description(): TaskDescriptionValueObject | null {
    return this._description;
  }

  get handlerKey(): TaskHandlerKeyValueObject | null {
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

  get defaultCronExpression(): TaskCronExpressionValueObject | null {
    return this._defaultCronExpression;
  }

  get defaultIsRecurring(): TaskIsRecurringValueObject {
    return this._defaultIsRecurring;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  toPrimitives(): ITaskTemplatePrimitives {
    return {
      id: this._id.value,
      name: this._name.value,
      description: this._description?.value ?? null,
      handlerKey: this._handlerKey?.value ?? null,
      defaultPriority: this._defaultPriority.value,
      defaultRetryCount: this._defaultRetryCount.value,
      defaultBackoffStrategy: this._defaultBackoffStrategy.value,
      defaultTimeoutMs: this._defaultTimeoutMs.value,
      maxConcurrency: this._maxConcurrency.value,
      defaultCronExpression: this._defaultCronExpression?.value ?? null,
      defaultIsRecurring: this._defaultIsRecurring.value,
      userId: this._userId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
