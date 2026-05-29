import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { IMembershipReadRepository } from '@contexts/spaces/domain/repositories/read/membership-read.repository';

import { MembershipFindByUserAndSpaceQuery } from './membership-find-by-user-and-space.query';
import { MembershipFindByUserAndSpaceQueryHandler } from './membership-find-by-user-and-space.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('MembershipFindByUserAndSpaceQueryHandler', () => {
  let handler: MembershipFindByUserAndSpaceQueryHandler;
  let membershipReadRepository: jest.Mocked<IMembershipReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    membershipReadRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      countByOwner: jest.fn(),
    } as jest.Mocked<IMembershipReadRepository>;

    handler = new MembershipFindByUserAndSpaceQueryHandler(
      membershipReadRepository,
    );
  });

  describe('found', () => {
    it('should return the membership when user is a member of the space', async () => {
      const membership = SpaceMembership.create(
        USER_ID,
        SPACE_ID,
        MembershipRoleEnum.MEMBER,
      );
      membershipReadRepository.findByCriteria.mockResolvedValue({
        items: [membership],
        total: 1,
        page: 1,
        limit: 10,
      } as any);

      const result = await handler.execute(
        new MembershipFindByUserAndSpaceQuery({
          userId: USER_ID,
          spaceId: SPACE_ID,
        }),
      );

      expect(result).toBe(membership);
      expect(membershipReadRepository.findByCriteria).toHaveBeenCalledTimes(1);
    });
  });

  describe('not found', () => {
    it('should return null when user is not a member of the space', async () => {
      membershipReadRepository.findByCriteria.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      } as any);

      const result = await handler.execute(
        new MembershipFindByUserAndSpaceQuery({
          userId: USER_ID,
          spaceId: SPACE_ID,
        }),
      );

      expect(result).toBeNull();
    });

    it('null return value is falsy (SpaceGuard can use it as a boolean check)', async () => {
      membershipReadRepository.findByCriteria.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      } as any);

      const result = await handler.execute(
        new MembershipFindByUserAndSpaceQuery({
          userId: USER_ID,
          spaceId: SPACE_ID,
        }),
      );

      expect(result).toBeFalsy();
    });
  });
});
