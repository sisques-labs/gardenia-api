import { DateValueObject } from '@sisques-labs/nestjs-kit';

export class InvitationExpiresAtValueObject extends DateValueObject {
  constructor(date: Date) {
    super(date);
  }
}
