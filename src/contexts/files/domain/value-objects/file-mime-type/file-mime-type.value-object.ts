import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';

export class FileMimeTypeValueObject extends EnumValueObject<
  typeof FileMimeTypeEnum
> {
  constructor(value: FileMimeTypeEnum) {
    super(value);
  }

  protected get enumObject(): typeof FileMimeTypeEnum {
    return FileMimeTypeEnum as unknown as typeof FileMimeTypeEnum;
  }
}
