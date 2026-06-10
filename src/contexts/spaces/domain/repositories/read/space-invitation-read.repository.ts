import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { SpaceInvitationViewModel } from '../../view-models/space-invitation.view-model';

export const SPACE_INVITATION_READ_REPOSITORY = Symbol(
  'SPACE_INVITATION_READ_REPOSITORY',
);

export interface ISpaceInvitationReadRepository extends IBaseReadRepository<SpaceInvitationViewModel> {
  findByCode(code: string): Promise<SpaceInvitationViewModel | null>;
}
