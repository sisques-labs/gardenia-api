import { Injectable } from '@nestjs/common';

import { SpaceInvitationPreviewViewModel } from '@contexts/spaces/domain/view-models/space-invitation-preview.view-model';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { AcceptSpaceInvitationResponseDto } from '../../dtos/accept-space-invitation-response.dto';
import { SpaceInvitationPreviewResponseDto } from '../../dtos/space-invitation-preview-response.dto';
import { SpaceInvitationRestResponseDto } from '../../dtos/space-invitation-rest-response.dto';

@Injectable()
export class SpaceInvitationRestMapper {
  toResponse(vm: SpaceInvitationViewModel): SpaceInvitationRestResponseDto {
    return {
      id: vm.id,
      displayCode: vm.displayCode,
      code: vm.code,
      qrId: vm.qrId,
      expiresAt: vm.expiresAt.toISOString(),
      role: vm.role,
      spaceId: vm.spaceId,
    };
  }

  toAcceptResponse(
    userId: string,
    spaceId: string,
  ): AcceptSpaceInvitationResponseDto {
    return { userId, spaceId };
  }

  toPreviewResponse(
    vm: SpaceInvitationPreviewViewModel,
  ): SpaceInvitationPreviewResponseDto {
    return {
      spaceName: vm.spaceName,
      role: vm.role,
      expiresAt: vm.expiresAt.toISOString(),
      isExpired: vm.isExpired,
    };
  }
}
