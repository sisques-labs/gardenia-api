import { Injectable } from '@nestjs/common';

import { SpaceInvitationPreviewViewModel } from '@contexts/spaces/domain/view-models/space-invitation-preview.view-model';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { SpaceInvitationPreviewResponseDto } from '../../objects/space-invitation-preview.object';
import { SpaceInvitationResponseDto } from '../../objects/space-invitation.object';

@Injectable()
export class SpaceInvitationGraphQLMapper {
  toResponse(vm: SpaceInvitationViewModel): SpaceInvitationResponseDto {
    return {
      id: vm.id,
      displayCode: vm.displayCode,
      code: vm.code,
      qrId: vm.qrId,
      expiresAt: vm.expiresAt,
      role: vm.role,
      spaceId: vm.spaceId,
    };
  }

  toPreviewResponse(
    vm: SpaceInvitationPreviewViewModel,
  ): SpaceInvitationPreviewResponseDto {
    return {
      spaceName: vm.spaceName,
      role: vm.role,
      expiresAt: vm.expiresAt,
      isExpired: vm.isExpired,
    };
  }
}
