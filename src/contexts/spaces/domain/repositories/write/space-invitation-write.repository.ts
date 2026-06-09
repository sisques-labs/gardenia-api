import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { SpaceInvitationAggregate } from '../../aggregates/space-invitation.aggregate';

export const SPACE_INVITATION_WRITE_REPOSITORY = Symbol(
  'SPACE_INVITATION_WRITE_REPOSITORY',
);

export interface ISpaceInvitationWriteRepository extends IBaseWriteRepository<SpaceInvitationAggregate> {
  findByCode(code: string): Promise<SpaceInvitationAggregate | null>;
}
