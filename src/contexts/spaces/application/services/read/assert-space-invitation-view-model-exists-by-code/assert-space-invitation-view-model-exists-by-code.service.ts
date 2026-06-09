import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { InvitationNotFoundException } from '@contexts/spaces/domain/exceptions/invitation-not-found.exception';
import {
  ISpaceInvitationReadRepository,
  SPACE_INVITATION_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-invitation-read.repository';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';

@Injectable()
export class AssertSpaceInvitationViewModelExistsByCodeService implements IBaseService {
  constructor(
    @Inject(SPACE_INVITATION_READ_REPOSITORY)
    private readonly spaceInvitationReadRepository: ISpaceInvitationReadRepository,
  ) {}

  async execute(code: string): Promise<SpaceInvitationViewModel> {
    const invitation =
      await this.spaceInvitationReadRepository.findByCode(code);

    if (!invitation) {
      throw new InvitationNotFoundException(code);
    }

    return invitation;
  }
}
