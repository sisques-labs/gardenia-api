import { Injectable } from '@nestjs/common';

import { AssertSpaceInvitationViewModelExistsByCodeService } from '@contexts/spaces/application/services/read/assert-space-invitation-view-model-exists-by-code/assert-space-invitation-view-model-exists-by-code.service';
import { SpaceContext } from '@shared/space-context/space-context.service';

@Injectable()
export class ResolveInvitationSpaceContextService {
  constructor(
    private readonly assertSpaceInvitationViewModelExistsByCodeService: AssertSpaceInvitationViewModelExistsByCodeService,
    private readonly spaceContext: SpaceContext,
  ) {}

  async run<T>(code: string, fn: () => Promise<T>): Promise<T> {
    const invitation =
      await this.assertSpaceInvitationViewModelExistsByCodeService.execute(
        code,
      );

    return this.spaceContext.run(invitation.spaceId, fn);
  }
}
