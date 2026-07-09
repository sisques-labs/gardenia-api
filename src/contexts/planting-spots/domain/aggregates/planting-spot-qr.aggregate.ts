import {
  BaseAggregate,
  NumberValueObject,
  StringValueObject,
  UrlValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { IPlantingSpotQr } from '@contexts/planting-spots/domain/interfaces/planting-spot-qr.interface';
import { IPlantingSpotQrPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot-qr.primitives';

/**
 * Read-only projection of a QR aggregate owned by the `qr` bounded context.
 * No domain behavior/events of its own — persistence and lifecycle live in
 * `qr`; this aggregate only carries the data resolved via IPlantingSpotQrPort
 * so it can flow through the builder's build()/buildViewModel() contract.
 */
export class PlantingSpotQrAggregate extends BaseAggregate {
  private readonly _id: UuidValueObject;
  private readonly _spaceId: UuidValueObject;
  private readonly _targetUrl: UrlValueObject;
  private readonly _generation: NumberValueObject;
  private readonly _image: StringValueObject;

  constructor(props: IPlantingSpotQr) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._spaceId = props.spaceId;
    this._targetUrl = props.targetUrl;
    this._generation = props.generation;
    this._image = props.image;
  }

  public toPrimitives(): IPlantingSpotQrPrimitives {
    return {
      id: this._id.value,
      spaceId: this._spaceId.value,
      targetUrl: this._targetUrl.value,
      generation: this._generation.value,
      image: this._image.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): UuidValueObject {
    return this._id;
  }
  get spaceId(): UuidValueObject {
    return this._spaceId;
  }
  get targetUrl(): UrlValueObject {
    return this._targetUrl;
  }
  get generation(): NumberValueObject {
    return this._generation;
  }
  get image(): StringValueObject {
    return this._image;
  }
}
