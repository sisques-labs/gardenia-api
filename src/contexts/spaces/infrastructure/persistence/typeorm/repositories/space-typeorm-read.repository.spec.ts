import { Repository } from 'typeorm';

import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import { SpaceMembershipEntity } from '../entities/space-membership.entity';
import { SpaceEntity } from '../entities/space.entity';
import { SpaceMembershipTypeOrmMapper } from '../mappers/space-membership-typeorm.mapper';
import { SpaceTypeOrmMapper } from '../mappers/space-typeorm.mapper';
import { SpaceTypeOrmReadRepository } from './space-typeorm-read.repository';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440002';
const USER_ID = '550e8400-e29b-41d4-a716-446655440003';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-01T00:00:00.000Z');

const buildSpaceEntity = (): SpaceEntity => {
  const entity = new SpaceEntity();
  entity.id = SPACE_ID;
  entity.name = 'Test Space';
  entity.ownerId = OWNER_ID;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return entity;
};

const buildMembershipEntity = (
  userId = USER_ID,
  role = MembershipRoleEnum.MEMBER,
): SpaceMembershipEntity => {
  const entity = new SpaceMembershipEntity();
  entity.id = '550e8400-e29b-41d4-a716-446655440010';
  entity.spaceId = SPACE_ID;
  entity.userId = userId;
  entity.role = role;
  entity.joinedAt = CREATED_AT;
  return entity;
};

describe('SpaceTypeOrmReadRepository', () => {
  let repository: SpaceTypeOrmReadRepository;
  let spaceRepo: jest.Mocked<Repository<SpaceEntity>>;
  let membershipRepo: jest.Mocked<Repository<SpaceMembershipEntity>>;
  let spaceMapper: SpaceTypeOrmMapper;
  let membershipMapper: SpaceMembershipTypeOrmMapper;

  beforeEach(() => {
    jest.clearAllMocks();

    spaceRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<SpaceEntity>>;

    membershipRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<SpaceMembershipEntity>>;

    spaceMapper = new SpaceTypeOrmMapper(new SpaceBuilder());
    membershipMapper = new SpaceMembershipTypeOrmMapper();

    repository = new SpaceTypeOrmReadRepository(
      spaceRepo,
      membershipRepo,
      spaceMapper,
      membershipMapper,
    );
  });

  describe('findById()', () => {
    it('should return a SpaceViewModel when entity is found', async () => {
      const entity = buildSpaceEntity();
      spaceRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(SPACE_ID);

      expect(spaceRepo.findOne).toHaveBeenCalledWith({
        where: { id: SPACE_ID },
      });
      expect(result).toBeInstanceOf(SpaceViewModel);
      expect(result?.id).toBe(SPACE_ID);
    });

    it('should return null when entity is not found', async () => {
      spaceRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserAndSpace()', () => {
    it('should return a SpaceMembership when found', async () => {
      const membershipEntity = buildMembershipEntity(
        USER_ID,
        MembershipRoleEnum.MEMBER,
      );
      membershipRepo.findOne.mockResolvedValue(membershipEntity);

      const result = await repository.findByUserAndSpace(USER_ID, SPACE_ID);

      expect(membershipRepo.findOne).toHaveBeenCalledWith({
        where: { userId: USER_ID, spaceId: SPACE_ID },
      });
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(USER_ID);
      expect(result?.spaceId).toBe(SPACE_ID);
    });

    it('should return null when membership is not found', async () => {
      membershipRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByUserAndSpace(USER_ID, SPACE_ID);

      expect(result).toBeNull();
    });
  });

  describe('countByOwner()', () => {
    it('should count spaces where user is owner', async () => {
      membershipRepo.count.mockResolvedValue(3);

      const result = await repository.countByOwner(OWNER_ID);

      expect(membershipRepo.count).toHaveBeenCalledWith({
        where: { userId: OWNER_ID, role: MembershipRoleEnum.OWNER },
      });
      expect(result).toBe(3);
    });

    it('should return 0 when user owns no spaces', async () => {
      membershipRepo.count.mockResolvedValue(0);

      const result = await repository.countByOwner(USER_ID);

      expect(result).toBe(0);
    });
  });
});
