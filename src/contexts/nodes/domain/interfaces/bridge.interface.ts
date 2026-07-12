import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { BridgeIdValueObject } from '../value-objects/bridge-id/bridge-id.value-object';
import { BridgeNameValueObject } from '../value-objects/bridge-name/bridge-name.value-object';
import { BridgeStatusValueObject } from '../value-objects/bridge-status/bridge-status.value-object';
import { PairingCodeValueObject } from '../value-objects/pairing-code/pairing-code.value-object';

export interface IBridge {
  id: BridgeIdValueObject;
  spaceId: UuidValueObject | null;
  name: BridgeNameValueObject | null;
  status: BridgeStatusValueObject;
  pairingCode: PairingCodeValueObject | null;
  lastSeenAt: Date | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
