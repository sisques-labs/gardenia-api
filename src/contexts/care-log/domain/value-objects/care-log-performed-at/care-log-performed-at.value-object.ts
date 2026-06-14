import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogPerformedAtInvalidException } from '@contexts/care-log/domain/exceptions/care-log-performed-at-invalid.exception';

export class CareLogPerformedAtValueObject extends DateValueObject {
  constructor(value: Date) {
    super(value);
  }

  protected validate(): void {
    super.validate();
    if (this.value > new Date()) {
      throw new CareLogPerformedAtInvalidException();
    }
  }
}
