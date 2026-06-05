import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrCreatedEvent } from '@contexts/qr/domain/events/qr-created/qr-created.event';
import { QrDeletedEvent } from '@contexts/qr/domain/events/qr-deleted/qr-deleted.event';
import { QrRegeneratedEvent } from '@contexts/qr/domain/events/qr-regenerated/qr-regenerated.event';
import { IQr } from '@contexts/qr/domain/interfaces/qr.interface';
import { IQrPrimitives } from '@contexts/qr/domain/primitives/qr.primitives';
import { QrExpiresAtValueObject } from '@contexts/qr/domain/value-objects/qr-expires-at/qr-expires-at.value-object';
import { QrGenerationValueObject } from '@contexts/qr/domain/value-objects/qr-generation/qr-generation.value-object';
import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';
import { QrTargetUrlValueObject } from '@contexts/qr/domain/value-objects/qr-target-url/qr-target-url.value-object';

export class QrAggregate extends BaseAggregate {
  private readonly _id: QrIdValueObject;
  private readonly _spaceId: UuidValueObject;
  private readonly _targetUrl: QrTargetUrlValueObject;
  private _generation: QrGenerationValueObject;
  private readonly _expiresAt: QrExpiresAtValueObject | null;

  constructor(props: IQr) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._spaceId = props.spaceId;
    this._targetUrl = props.targetUrl;
    this._generation = props.generation;
    this._expiresAt = props.expiresAt;
  }

  public checkExpiresAt(): void {
    if (this._expiresAt !== null && this._expiresAt.value! <= new Date()) {
      throw new Error('expiresAt must be a future date');
    }
  }

  public create(): void {
    this.apply(
      new QrCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: QrAggregate.name,
          entityId: this._id.value,
          entityType: QrAggregate.name,
          eventType: QrCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public regenerate(): void {
    this._generation = this._generation.increment();
    this.touch();
    this.apply(
      new QrRegeneratedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: QrAggregate.name,
          entityId: this._id.value,
          entityType: QrAggregate.name,
          eventType: QrRegeneratedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public delete(): void {
    this.apply(
      new QrDeletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: QrAggregate.name,
          entityId: this._id.value,
          entityType: QrAggregate.name,
          eventType: QrDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public toPrimitives(): IQrPrimitives {
    return {
      id: this._id.value,
      spaceId: this._spaceId.value,
      targetUrl: this._targetUrl.value,
      generation: this._generation.value,
      expiresAt: this._expiresAt?.value ?? null,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  public isExpired(): boolean {
    return this._expiresAt !== null && this._expiresAt.value! < new Date();
  }

  get id(): QrIdValueObject {
    return this._id;
  }

  get spaceId(): UuidValueObject {
    return this._spaceId;
  }

  get targetUrl(): QrTargetUrlValueObject {
    return this._targetUrl;
  }

  get generation(): QrGenerationValueObject {
    return this._generation;
  }

  get expiresAt(): QrExpiresAtValueObject | null {
    return this._expiresAt;
  }
}
