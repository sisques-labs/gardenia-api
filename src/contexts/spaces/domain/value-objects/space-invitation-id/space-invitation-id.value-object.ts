import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class SpaceInvitationIdValueObject extends UuidValueObject {
  constructor(value: string) {
    super(value);
  }
}
