import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class InvitationCodeValueObject extends StringValueObject {
  constructor(value: string) {
    super(InvitationCodeValueObject.normalize(value));
  }

  static normalize(input: string): string {
    return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
}
