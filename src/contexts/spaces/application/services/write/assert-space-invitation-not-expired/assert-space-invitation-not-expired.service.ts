import { Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { InvitationExpiredException } from '@contexts/spaces/domain/exceptions/invitation-expired.exception';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';

@Injectable()
export class AssertSpaceInvitationNotExpiredService implements IBaseService {
  async execute(invitation: SpaceInvitationViewModel): Promise<void> {
    if (invitation.expiresAt < new Date()) {
      throw new InvitationExpiredException(invitation.code);
    }
  }
}
