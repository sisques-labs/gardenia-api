import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { NodeStatusEnum } from '@contexts/nodes/domain/enums/node-status.enum';

export class NodeStatusValueObject extends EnumValueObject<
  typeof NodeStatusEnum
> {
  constructor(value: NodeStatusEnum) {
    super(value);
  }

  protected get enumObject(): typeof NodeStatusEnum {
    return NodeStatusEnum;
  }
}
