import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { InvitationCodeValueObject } from '@contexts/spaces/domain/value-objects/invitation-code/invitation-code.value-object';

export interface AcceptSpaceInvitationCommandInput {
  code: string;
  acceptingUserId: string;
}

export class AcceptSpaceInvitationCommand {
  public readonly code: InvitationCodeValueObject;
  public readonly acceptingUserId: UuidValueObject;

  constructor(input: AcceptSpaceInvitationCommandInput) {
    this.code = new InvitationCodeValueObject(input.code);
    this.acceptingUserId = new UuidValueObject(input.acceptingUserId);
  }
}
