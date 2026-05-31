import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';
import { QrTargetUrlValueObject } from '@contexts/qr/domain/value-objects/qr-target-url/qr-target-url.value-object';

export interface IQr {
  id: QrIdValueObject;
  spaceId: UuidValueObject;
  targetUrl: QrTargetUrlValueObject;
  generation: number;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
