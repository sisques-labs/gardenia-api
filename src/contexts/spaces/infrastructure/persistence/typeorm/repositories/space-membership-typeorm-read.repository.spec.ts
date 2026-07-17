import { Criteria, SortDirection } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { SpaceMembershipBuilder } from '@contexts/spaces/domain/builders/space-membership.builder';
import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceMembershipEntity } from '../entities/space-membership.entity';
import { SpaceMembershipTypeOrmMapper } from '../mappers/space-membership-typeorm.mapper';
import { SpaceMembershipTypeOrmReadRepository } from './space-membership-typeorm-read.repository';

const MEMBERSHIP_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '660e8400-e29b-41d4-a716-446655440001';
const USER_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<SpaceMembershipEntity> = {},
): SpaceMembershipEntity => {
  const e = new SpaceMembershipEntity();
  e.id = MEMBERSHIP_ID;
  e.spaceId = SPACE_ID;
  e.userId = USER_ID;
  e.role = MembershipRoleEnum.MEMBER;
  e.joinedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

describe('SpaceMembershipTypeOrmReadRepository', () => {
  let repository: SpaceMembershipTypeOrmReadRepository;
  let membershipRepo: jest.Mocked<Repository<SpaceMembershipEntity>>;
  let membershipMapper: SpaceMembershipTypeOrmMapper;

  beforeEach(() => {
    membershipRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<SpaceMembershipEntity>>;

    membershipMapper = new SpaceMembershipTypeOrmMapper(
      new SpaceMembershipBuilder(),
    );

    repository = new SpaceMembershipTypeOrmReadRepository(
      membershipRepo,
      membershipMapper,
    );
  });

  describe('findById()', () => {
    it('returns SpaceMembership when entity is found', async () => {
      membershipRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(MEMBERSHIP_ID);

      expect(result).toBeInstanceOf(SpaceMembership);
      expect(result!.userId).toBe(USER_ID);
      expect(membershipRepo.findOne).toHaveBeenCalledWith({
        where: { id: MEMBERSHIP_ID },
      });
    });

    it('returns null when entity is not found', async () => {
      membershipRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated results without filters', async () => {
      membershipRepo.findAndCount.mockResolvedValue([[buildEntity()], 1]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(SpaceMembership);
      expect(result.total).toBe(1);
      expect(membershipRepo.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: {},
      });
    });

    it('builds the where clause from filters and order from sorts', async () => {
      membershipRepo.findAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [{ field: 'spaceId', operator: 'eq' as any, value: SPACE_ID }],
          [{ field: 'joinedAt', direction: SortDirection.ASC }],
          { page: 2, perPage: 5 },
        ),
      );

      expect(membershipRepo.findAndCount).toHaveBeenCalledWith({
        where: { spaceId: SPACE_ID },
        skip: 5,
        take: 5,
        order: { joinedAt: SortDirection.ASC },
      });
    });

    it('falls back to an empty where clause when filters is null', async () => {
      membershipRepo.findAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(null as any, undefined, undefined),
      );

      expect(membershipRepo.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: {},
      });
    });

    it('returns empty result when no memberships match', async () => {
      membershipRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('save()', () => {
    it('resolves without doing anything', async () => {
      const membership = membershipMapper.toDomain(buildEntity());

      await expect(repository.save(membership)).resolves.toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('resolves without doing anything', async () => {
      await expect(repository.delete(MEMBERSHIP_ID)).resolves.toBeUndefined();
    });
  });

  describe('countByOwner()', () => {
    it('counts memberships with the OWNER role for the given user', async () => {
      membershipRepo.count.mockResolvedValue(3);

      const result = await repository.countByOwner(USER_ID);

      expect(result).toBe(3);
      expect(membershipRepo.count).toHaveBeenCalledWith({
        where: { userId: USER_ID, role: MembershipRoleEnum.OWNER },
      });
    });
  });
});
