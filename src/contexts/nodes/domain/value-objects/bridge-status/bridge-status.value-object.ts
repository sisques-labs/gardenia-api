import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { BridgeStatusEnum } from '@contexts/nodes/domain/enums/bridge-status.enum';

export class BridgeStatusValueObject extends EnumValueObject<
  typeof BridgeStatusEnum
> {
  constructor(value: BridgeStatusEnum) {
    super(value);
  }

  protected get enumObject(): typeof BridgeStatusEnum {
    return BridgeStatusEnum;
  }
}
