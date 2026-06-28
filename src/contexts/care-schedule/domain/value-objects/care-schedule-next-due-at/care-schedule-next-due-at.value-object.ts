import { DateValueObject } from '@sisques-labs/nestjs-kit';

export class CareScheduleNextDueAtValueObject extends DateValueObject {
  constructor(value: Date) {
    super(value);
  }
}
