import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { QrGenerationValueObject } from '@contexts/qr/domain/value-objects/qr-generation/qr-generation.value-object';
import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';
import { QrTargetUrlValueObject } from '@contexts/qr/domain/value-objects/qr-target-url/qr-target-url.value-object';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

@Injectable()
export class QrBuilder extends BaseBuilder<QrAggregate, QrViewModel> {
  private _spaceId!: string;
  private _targetUrl!: string;
  private _generation = 1;

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  withTargetUrl(targetUrl: string): this {
    this._targetUrl = targetUrl;
    return this;
  }

  withGeneration(generation: number): this {
    this._generation = generation;
    return this;
  }

  public override build(): QrAggregate {
    this.validate();
    return new QrAggregate({
      id: new QrIdValueObject(this._id),
      spaceId: new UuidValueObject(this._spaceId),
      targetUrl: new QrTargetUrlValueObject(this._targetUrl),
      generation: new QrGenerationValueObject(this._generation),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): QrViewModel {
    this.validate();
    return new QrViewModel({
      id: this._id,
      spaceId: this._spaceId,
      targetUrl: this._targetUrl,
      generation: this._generation,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
    if (!this._targetUrl) throw new FieldIsRequiredException('targetUrl');
  }
}
