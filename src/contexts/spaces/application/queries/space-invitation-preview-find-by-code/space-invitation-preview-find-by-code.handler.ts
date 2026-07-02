import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertSpaceInvitationViewModelExistsByCodeService } from '@contexts/spaces/application/services/read/assert-space-invitation-view-model-exists-by-code/assert-space-invitation-view-model-exists-by-code.service';
import { AssertSpaceViewModelExistsService } from '@contexts/spaces/application/services/read/assert-space-view-model-exists/assert-space-view-model-exists.service';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';
import { SpaceInvitationPreviewViewModel } from '@contexts/spaces/domain/view-models/space-invitation-preview.view-model';

import { SpaceInvitationPreviewFindByCodeQuery } from './space-invitation-preview-find-by-code.query';

@QueryHandler(SpaceInvitationPreviewFindByCodeQuery)
export class SpaceInvitationPreviewFindByCodeQueryHandler implements IQueryHandler<
  SpaceInvitationPreviewFindByCodeQuery,
  SpaceInvitationPreviewViewModel
> {
  constructor(
    private readonly assertSpaceInvitationViewModelExistsByCodeService: AssertSpaceInvitationViewModelExistsByCodeService,
    private readonly assertSpaceViewModelExistsService: AssertSpaceViewModelExistsService,
  ) {}

  async execute(
    query: SpaceInvitationPreviewFindByCodeQuery,
  ): Promise<SpaceInvitationPreviewViewModel> {
    const invitation =
      await this.assertSpaceInvitationViewModelExistsByCodeService.execute(
        query.code.value,
      );

    const space = await this.assertSpaceViewModelExistsService.execute(
      new SpaceIdValueObject(invitation.spaceId),
    );

    return {
      spaceName: space.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      isExpired: invitation.expiresAt < new Date(),
    };
  }
}
