import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrIdValueObject } from '../value-objects/qr-id/qr-id.value-object';
import { QrTargetUrlValueObject } from '../value-objects/qr-target-url/qr-target-url.value-object';

export interface IQr {
  id: QrIdValueObject;
  plantId: UuidValueObject;
  spaceId: UuidValueObject;
  targetUrl: QrTargetUrlValueObject;
  generation: number;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
