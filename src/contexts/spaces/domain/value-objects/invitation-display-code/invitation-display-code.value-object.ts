import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class InvitationDisplayCodeValueObject extends StringValueObject {
  constructor(value: string) {
    super(value);
  }
}
