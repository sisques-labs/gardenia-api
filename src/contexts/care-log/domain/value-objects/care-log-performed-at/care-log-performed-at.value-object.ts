import { DateValueObject } from '@sisques-labs/nestjs-kit';

export class CareLogPerformedAtValueObject extends DateValueObject {
  constructor(value: Date) {
    super(value);
    if (value > new Date()) {
      throw new Error(
        'CareLogPerformedAtValueObject: performedAt cannot be in the future',
      );
    }
  }
}
