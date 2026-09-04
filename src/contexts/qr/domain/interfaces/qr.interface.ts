import { IBaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';
import { QrExpiresAtValueObject } from '@contexts/qr/domain/value-objects/qr-expires-at/qr-expires-at.value-object';
import { QrGenerationValueObject } from '@contexts/qr/domain/value-objects/qr-generation/qr-generation.value-object';

import { QrTargetUrlValueObject } from '@contexts/qr/domain/value-objects/qr-target-url/qr-target-url.value-object';

export interface IQr extends IBaseAggregate {
  spaceId: UuidValueObject;
  targetUrl: QrTargetUrlValueObject;
  generation: QrGenerationValueObject;
  expiresAt: QrExpiresAtValueObject | null;
}
