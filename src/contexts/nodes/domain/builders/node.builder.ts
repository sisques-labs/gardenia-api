import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { NodeAggregate } from '@contexts/nodes/domain/aggregates/node.aggregate';
import { NodeStatusEnum } from '@contexts/nodes/domain/enums/node-status.enum';
import { NodeViewModel } from '@contexts/nodes/domain/view-models/node.view-model';
import { NodeIdValueObject } from '@contexts/nodes/domain/value-objects/node-id/node-id.value-object';
import { NodeNameValueObject } from '@contexts/nodes/domain/value-objects/node-name/node-name.value-object';
import { NodeStatusValueObject } from '@contexts/nodes/domain/value-objects/node-status/node-status.value-object';

@Injectable()
export class NodeBuilder extends BaseBuilder<NodeAggregate, NodeViewModel> {
  private _spaceId!: string;
  private _bridgeId!: string;
  private _name: string | null = null;
  private _status: string = NodeStatusEnum.OFFLINE;
  private _lastSeenAt: Date | null = null;

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  withBridgeId(bridgeId: string): this {
    this._bridgeId = bridgeId;
    return this;
  }

  withName(name: string | null): this {
    this._name = name;
    return this;
  }

  withStatus(status: string): this {
    this._status = status;
    return this;
  }

  withLastSeenAt(lastSeenAt: Date | null): this {
    this._lastSeenAt = lastSeenAt;
    return this;
  }

  public override build(): NodeAggregate {
    this.validate();
    return new NodeAggregate({
      id: new NodeIdValueObject(this._id),
      spaceId: new UuidValueObject(this._spaceId),
      bridgeId: new UuidValueObject(this._bridgeId),
      name: this._name != null ? new NodeNameValueObject(this._name) : null,
      status: new NodeStatusValueObject(this._status as NodeStatusEnum),
      lastSeenAt: this._lastSeenAt,
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): NodeViewModel {
    this.validate();
    return new NodeViewModel({
      id: this._id,
      spaceId: this._spaceId,
      bridgeId: this._bridgeId,
      name: this._name,
      status: this._status,
      lastSeenAt: this._lastSeenAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
    if (!this._bridgeId) throw new FieldIsRequiredException('bridgeId');
  }
}
