import { Injectable } from '@nestjs/common';

import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { AcceptSpaceInvitationResponseDto } from '../../dtos/accept-space-invitation-response.dto';
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

  toAcceptResponse(userId: string): AcceptSpaceInvitationResponseDto {
    return { userId };
  }
}
