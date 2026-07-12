import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NodeCreatedEvent } from '../events/node-created/node-created.event';
import { NodeWentOfflineEvent } from '../events/node-went-offline/node-went-offline.event';
import { NodeWentOnlineEvent } from '../events/node-went-online/node-went-online.event';
import { NodeStatusEnum } from '../enums/node-status.enum';
import { INode } from '../interfaces/node.interface';
import { INodePrimitives } from '../primitives/node.primitives';
import { NodeIdValueObject } from '../value-objects/node-id/node-id.value-object';
import { NodeNameValueObject } from '../value-objects/node-name/node-name.value-object';
import { NodeStatusValueObject } from '../value-objects/node-status/node-status.value-object';

export class NodeAggregate extends BaseAggregate {
  private readonly _id: NodeIdValueObject;
  private readonly _spaceId: UuidValueObject;
  private readonly _bridgeId: UuidValueObject;
  private _name: NodeNameValueObject | null;
  private _status: NodeStatusValueObject;
  private _lastSeenAt: Date | null;

  constructor(props: INode) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._spaceId = props.spaceId;
    this._bridgeId = props.bridgeId;
    this._name = props.name;
    this._status = props.status;
    this._lastSeenAt = props.lastSeenAt;
  }

  public create(): void {
    this.apply(
      new NodeCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: NodeAggregate.name,
          entityId: this._id.value,
          entityType: NodeAggregate.name,
          eventType: NodeCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public markOnline(): void {
    if (this._status.value === NodeStatusEnum.ONLINE) {
      return;
    }

    this._status = new NodeStatusValueObject(NodeStatusEnum.ONLINE);
    this.touch();

    this.apply(
      new NodeWentOnlineEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: NodeAggregate.name,
          entityId: this._id.value,
          entityType: NodeAggregate.name,
          eventType: NodeWentOnlineEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public markOffline(): void {
    if (this._status.value === NodeStatusEnum.OFFLINE) {
      return;
    }

    this._status = new NodeStatusValueObject(NodeStatusEnum.OFFLINE);
    this.touch();

    this.apply(
      new NodeWentOfflineEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: NodeAggregate.name,
          entityId: this._id.value,
          entityType: NodeAggregate.name,
          eventType: NodeWentOfflineEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public touchLastSeen(at: Date): void {
    this._lastSeenAt = at;
    this.touch();
  }

  public toPrimitives(): INodePrimitives {
    return {
      id: this._id.value,
      spaceId: this._spaceId.value,
      bridgeId: this._bridgeId.value,
      name: this._name?.value ?? null,
      status: this._status.value,
      lastSeenAt: this._lastSeenAt,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): NodeIdValueObject {
    return this._id;
  }

  get spaceId(): UuidValueObject {
    return this._spaceId;
  }

  get bridgeId(): UuidValueObject {
    return this._bridgeId;
  }

  get name(): NodeNameValueObject | null {
    return this._name;
  }

  get status(): NodeStatusValueObject {
    return this._status;
  }

  get lastSeenAt(): Date | null {
    return this._lastSeenAt;
  }
}
