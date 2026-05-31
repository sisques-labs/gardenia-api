import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrCreatedEvent } from '../events/qr-created/qr-created.event';
import { QrDeletedEvent } from '../events/qr-deleted/qr-deleted.event';
import { QrRegeneratedEvent } from '../events/qr-regenerated/qr-regenerated.event';
import { IQr } from '../interfaces/qr.interface';
import { IQrPrimitives } from '../primitives/qr.primitives';
import { QrIdValueObject } from '../value-objects/qr-id/qr-id.value-object';
import { QrTargetUrlValueObject } from '../value-objects/qr-target-url/qr-target-url.value-object';

export class QrAggregate extends BaseAggregate {
  private readonly _id: QrIdValueObject;
  private readonly _plantId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;
  private readonly _targetUrl: QrTargetUrlValueObject;
  private _generation: number;

  constructor(props: IQr) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._plantId = props.plantId;
    this._spaceId = props.spaceId;
    this._targetUrl = props.targetUrl;
    this._generation = props.generation;
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
    this._generation += 1;
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
      plantId: this._plantId.value,
      spaceId: this._spaceId.value,
      targetUrl: this._targetUrl.value,
      generation: this._generation,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): QrIdValueObject {
    return this._id;
  }

  get plantId(): UuidValueObject {
    return this._plantId;
  }

  get spaceId(): UuidValueObject {
    return this._spaceId;
  }

  get targetUrl(): QrTargetUrlValueObject {
    return this._targetUrl;
  }

  get generation(): number {
    return this._generation;
  }
}
