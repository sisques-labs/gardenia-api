import { Injectable } from '@nestjs/common';

import { AcceptSpaceInvitationResult } from '@contexts/spaces/application/commands/accept-space-invitation/accept-space-invitation.handler';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import {
  SpaceAcceptInvitationResponseDto,
  SpaceInvitationResponseDto,
} from '../../objects/space-invitation.object';

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

  toAcceptResponse(
    result: AcceptSpaceInvitationResult,
  ): SpaceAcceptInvitationResponseDto {
    return {
      spaceId: result.spaceId,
      role: result.role,
    };
  }
}
