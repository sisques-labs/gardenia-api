import { Inject, Injectable } from '@nestjs/common';

import { InvitationNotFoundException } from '@contexts/spaces/domain/exceptions/invitation-not-found.exception';
import {
  ISpaceInvitationReadRepository,
  SPACE_INVITATION_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-invitation-read.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';

@Injectable()
export class ResolveInvitationSpaceContextService {
  constructor(
    @Inject(SPACE_INVITATION_READ_REPOSITORY)
    private readonly spaceInvitationReadRepository: ISpaceInvitationReadRepository,
    private readonly spaceContext: SpaceContext,
  ) {}

  async run<T>(code: string, fn: () => Promise<T>): Promise<T> {
    const invitation =
      await this.spaceInvitationReadRepository.findByCode(code);

    if (!invitation) {
      throw new InvitationNotFoundException(code);
    }

    return this.spaceContext.run(invitation.spaceId, fn);
  }
}
