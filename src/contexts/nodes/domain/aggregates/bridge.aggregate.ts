import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { BridgeAlreadyClaimedException } from '../exceptions/bridge-already-claimed.exception';
import { InvalidPairingCodeException } from '../exceptions/invalid-pairing-code.exception';
import { BridgeBootstrappedEvent } from '../events/bridge-bootstrapped/bridge-bootstrapped.event';
import { BridgeClaimedEvent } from '../events/bridge-claimed/bridge-claimed.event';
import { BridgeStatusEnum } from '../enums/bridge-status.enum';
import { IBridge } from '../interfaces/bridge.interface';
import { IBridgePrimitives } from '../primitives/bridge.primitives';
import { BridgeIdValueObject } from '../value-objects/bridge-id/bridge-id.value-object';
import { BridgeNameValueObject } from '../value-objects/bridge-name/bridge-name.value-object';
import { BridgeStatusValueObject } from '../value-objects/bridge-status/bridge-status.value-object';
import { PairingCodeValueObject } from '../value-objects/pairing-code/pairing-code.value-object';

export class BridgeAggregate extends BaseAggregate {
  private readonly _id: BridgeIdValueObject;
  private _spaceId: UuidValueObject | null;
  private _name: BridgeNameValueObject | null;
  private _status: BridgeStatusValueObject;
  private _pairingCode: PairingCodeValueObject | null;
  private _lastSeenAt: Date | null;

  constructor(props: IBridge) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._spaceId = props.spaceId;
    this._name = props.name;
    this._status = props.status;
    this._pairingCode = props.pairingCode;
    this._lastSeenAt = props.lastSeenAt;
  }

  /**
   * Called on every bridge bootstrap request. Idempotent no-op when the
   * bridge is already ACTIVE (re-announcing must never un-claim a bridge).
   * When UNCLAIMED, rotates the pairing code — a bridge that reboots before
   * being claimed gets a fresh code and the old one stops working.
   */
  public bootstrap(): void {
    if (this._status.value === BridgeStatusEnum.ACTIVE) {
      return;
    }

    this._status = new BridgeStatusValueObject(BridgeStatusEnum.UNCLAIMED);
    this._pairingCode = PairingCodeValueObject.generate();
    this.touch();

    this.apply(
      new BridgeBootstrappedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: BridgeAggregate.name,
          entityId: this._id.value,
          entityType: BridgeAggregate.name,
          eventType: BridgeBootstrappedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public claim(spaceId: string, suppliedCode: string): void {
    if (this._status.value !== BridgeStatusEnum.UNCLAIMED) {
      throw new BridgeAlreadyClaimedException(this._id.value);
    }

    if (!this._pairingCode || this._pairingCode.value !== suppliedCode) {
      throw new InvalidPairingCodeException(suppliedCode);
    }

    this._spaceId = new UuidValueObject(spaceId);
    this._status = new BridgeStatusValueObject(BridgeStatusEnum.ACTIVE);
    this._pairingCode = null;
    this.touch();

    this.apply(
      new BridgeClaimedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: BridgeAggregate.name,
          entityId: this._id.value,
          entityType: BridgeAggregate.name,
          eventType: BridgeClaimedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public rename(name: string): void {
    this._name = new BridgeNameValueObject(name);
    this.touch();
  }

  public toPrimitives(): IBridgePrimitives {
    return {
      id: this._id.value,
      spaceId: this._spaceId?.value ?? null,
      name: this._name?.value ?? null,
      status: this._status.value,
      pairingCode: this._pairingCode?.value ?? null,
      lastSeenAt: this._lastSeenAt,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): BridgeIdValueObject {
    return this._id;
  }

  get spaceId(): UuidValueObject | null {
    return this._spaceId;
  }

  get name(): BridgeNameValueObject | null {
    return this._name;
  }

  get status(): BridgeStatusValueObject {
    return this._status;
  }

  get pairingCode(): PairingCodeValueObject | null {
    return this._pairingCode;
  }

  get lastSeenAt(): Date | null {
    return this._lastSeenAt;
  }
}
