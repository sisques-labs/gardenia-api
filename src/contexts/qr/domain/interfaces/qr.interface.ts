import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrGenerationValueObject } from '@contexts/qr/domain/value-objects/qr-generation/qr-generation.value-object';
import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';
import { QrTargetUrlValueObject } from '@contexts/qr/domain/value-objects/qr-target-url/qr-target-url.value-object';

export interface IQr {
  id: QrIdValueObject;
  spaceId: UuidValueObject;
  targetUrl: QrTargetUrlValueObject;
  generation: QrGenerationValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
