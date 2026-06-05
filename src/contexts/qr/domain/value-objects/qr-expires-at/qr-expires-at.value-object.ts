import { DateValueObject } from '@sisques-labs/nestjs-kit';

export class QrExpiresAtValueObject extends DateValueObject {
  constructor(date: Date) {
    super(date);
  }
}
