import { Repository } from 'typeorm';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

import { SpaceMembershipEntity } from '../entities/space-membership.entity';
import { SpaceMembershipTypeOrmWriteRepository } from './space-membership-typeorm-write.repository';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('SpaceMembershipTypeOrmWriteRepository', () => {
  let repository: SpaceMembershipTypeOrmWriteRepository;
  let membershipRepo: jest.Mocked<Repository<SpaceMembershipEntity>>;

  beforeEach(() => {
    membershipRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<SpaceMembershipEntity>>;

    repository = new SpaceMembershipTypeOrmWriteRepository(membershipRepo);
  });

  describe('upsert', () => {
    it('inserts a new row when none exists for (userId, spaceId)', async () => {
      membershipRepo.findOne.mockResolvedValue(null);
      const syncedAt = new Date('2024-06-01T00:00:00.000Z');

      await repository.upsert(
        USER_ID,
        SPACE_ID,
        MembershipRoleEnum.MEMBER,
        syncedAt,
      );

      expect(membershipRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          spaceId: SPACE_ID,
          role: MembershipRoleEnum.MEMBER,
          syncedAt,
        }),
      );
    });

    it('updates role and syncedAt on an existing row instead of inserting a duplicate', async () => {
      const existing = new SpaceMembershipEntity();
      existing.id = 'existing-row-id';
      existing.userId = USER_ID;
      existing.spaceId = SPACE_ID;
      existing.role = MembershipRoleEnum.MEMBER;
      existing.joinedAt = new Date('2024-01-01T00:00:00.000Z');
      existing.syncedAt = null;
      membershipRepo.findOne.mockResolvedValue(existing);
      const syncedAt = new Date('2024-06-02T00:00:00.000Z');

      await repository.upsert(
        USER_ID,
        SPACE_ID,
        MembershipRoleEnum.OWNER,
        syncedAt,
      );

      expect(membershipRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'existing-row-id',
          role: MembershipRoleEnum.OWNER,
          syncedAt,
        }),
      );
    });
  });

  describe('deleteByUserAndSpace', () => {
    it('deletes the row matching userId and spaceId', async () => {
      await repository.deleteByUserAndSpace(USER_ID, SPACE_ID);

      expect(membershipRepo.delete).toHaveBeenCalledWith({
        userId: USER_ID,
        spaceId: SPACE_ID,
      });
    });
  });
});
