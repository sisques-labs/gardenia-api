import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { NotSpaceOwnerException } from '@contexts/spaces/domain/exceptions/not-space-owner.exception';
import { AssertUserIsSpaceOwnerService } from './assert-user-is-space-owner.service';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const membershipWithRole = (isOwner: boolean): SpaceMembership =>
  ({ role: { isOwner: () => isOwner } }) as unknown as SpaceMembership;

describe('AssertUserIsSpaceOwnerService', () => {
  let service: AssertUserIsSpaceOwnerService;

  beforeEach(() => {
    service = new AssertUserIsSpaceOwnerService();
  });

  it('resolves when the membership role is owner', async () => {
    await expect(
      service.execute({
        membership: membershipWithRole(true),
        userId: USER_ID,
        spaceId: SPACE_ID,
      }),
    ).resolves.toBeUndefined();
  });

  it('throws NotSpaceOwnerException when the membership role is not owner', async () => {
    await expect(
      service.execute({
        membership: membershipWithRole(false),
        userId: USER_ID,
        spaceId: SPACE_ID,
      }),
    ).rejects.toThrow(NotSpaceOwnerException);
  });
});
