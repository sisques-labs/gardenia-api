import { InvitationCodeValueObject } from '@contexts/spaces/domain/value-objects/invitation-code/invitation-code.value-object';

export type SpaceInvitationPreviewFindByCodeQueryInput = { code: string };

export class SpaceInvitationPreviewFindByCodeQuery {
  public readonly code: InvitationCodeValueObject;

  constructor(input: SpaceInvitationPreviewFindByCodeQueryInput) {
    this.code = new InvitationCodeValueObject(input.code);
  }
}
