import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { BridgeAggregate } from '@contexts/nodes/domain/aggregates/bridge.aggregate';
import { BridgeStatusEnum } from '@contexts/nodes/domain/enums/bridge-status.enum';
import { BridgeViewModel } from '@contexts/nodes/domain/view-models/bridge.view-model';
import { BridgeIdValueObject } from '@contexts/nodes/domain/value-objects/bridge-id/bridge-id.value-object';
import { BridgeNameValueObject } from '@contexts/nodes/domain/value-objects/bridge-name/bridge-name.value-object';
import { BridgeStatusValueObject } from '@contexts/nodes/domain/value-objects/bridge-status/bridge-status.value-object';
import { PairingCodeValueObject } from '@contexts/nodes/domain/value-objects/pairing-code/pairing-code.value-object';

@Injectable()
export class BridgeBuilder extends BaseBuilder<
  BridgeAggregate,
  BridgeViewModel
> {
  private _spaceId: string | null = null;
  private _name: string | null = null;
  private _status: string = BridgeStatusEnum.UNCLAIMED;
  private _pairingCode: string | null = null;
  private _lastSeenAt: Date | null = null;

  withSpaceId(spaceId: string | null): this {
    this._spaceId = spaceId;
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

  withPairingCode(pairingCode: string | null): this {
    this._pairingCode = pairingCode;
    return this;
  }

  withLastSeenAt(lastSeenAt: Date | null): this {
    this._lastSeenAt = lastSeenAt;
    return this;
  }

  public override build(): BridgeAggregate {
    this.validate();
    return new BridgeAggregate({
      id: new BridgeIdValueObject(this._id),
      spaceId:
        this._spaceId != null ? new UuidValueObject(this._spaceId) : null,
      name: this._name != null ? new BridgeNameValueObject(this._name) : null,
      status: new BridgeStatusValueObject(this._status as BridgeStatusEnum),
      pairingCode:
        this._pairingCode != null
          ? new PairingCodeValueObject(this._pairingCode)
          : null,
      lastSeenAt: this._lastSeenAt,
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): BridgeViewModel {
    this.validate();
    return new BridgeViewModel({
      id: this._id,
      spaceId: this._spaceId,
      name: this._name,
      status: this._status,
      pairingCode: this._pairingCode,
      lastSeenAt: this._lastSeenAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }
}
