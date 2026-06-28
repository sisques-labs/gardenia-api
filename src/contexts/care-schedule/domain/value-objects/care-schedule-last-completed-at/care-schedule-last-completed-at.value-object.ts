import { DateValueObject } from '@sisques-labs/nestjs-kit';

export class CareScheduleLastCompletedAtValueObject extends DateValueObject {
  constructor(value: Date) {
    super(value);
  }
}
