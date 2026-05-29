import { Repository } from 'typeorm';

import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceMembershipEntity } from '../entities/space-membership.entity';
import { SpaceEntity } from '../entities/space.entity';
import { SpaceMembershipTypeOrmMapper } from '../mappers/space-membership-typeorm.mapper';
import { SpaceTypeOrmMapper } from '../mappers/space-typeorm.mapper';
import { SpaceTypeOrmWriteRepository } from './space-typeorm-write.repository';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440002';
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

const buildSpaceAggregate = () => {
  const space = new SpaceBuilder()
    .withId(SPACE_ID)
    .withName('Test Space')
    .withOwnerId(OWNER_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT)
    .build();
  space.addMember(OWNER_ID, MembershipRoleEnum.OWNER);
  return space;
};

describe('SpaceTypeOrmWriteRepository', () => {
  let repository: SpaceTypeOrmWriteRepository;
  let spaceRepo: jest.Mocked<Repository<SpaceEntity>>;
  let membershipRepo: jest.Mocked<Repository<SpaceMembershipEntity>>;
  let spaceMapper: SpaceTypeOrmMapper;
  let membershipMapper: SpaceMembershipTypeOrmMapper;

  beforeEach(() => {
    jest.clearAllMocks();

    spaceRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<SpaceEntity>>;

    membershipRepo = {
      save: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<SpaceMembershipEntity>>;

    spaceMapper = new SpaceTypeOrmMapper(new SpaceBuilder());
    membershipMapper = new SpaceMembershipTypeOrmMapper();

    repository = new SpaceTypeOrmWriteRepository(
      spaceRepo,
      membershipRepo,
      spaceMapper,
      membershipMapper,
    );
  });

  describe('save()', () => {
    it('should save the space entity', async () => {
      const space = buildSpaceAggregate();
      const entity = buildSpaceEntity();

      spaceRepo.save.mockResolvedValue(entity);
      membershipRepo.save.mockResolvedValue({} as any);

      await repository.save(space);

      expect(spaceRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should save all membership entities', async () => {
      const space = buildSpaceAggregate();
      const entity = buildSpaceEntity();

      spaceRepo.save.mockResolvedValue(entity);
      membershipRepo.save.mockResolvedValue({} as any);

      await repository.save(space);

      expect(membershipRepo.save).toHaveBeenCalledTimes(
        space.memberships.length,
      );
    });

    it('should return the mapped aggregate after save', async () => {
      const space = buildSpaceAggregate();
      const entity = buildSpaceEntity();

      spaceRepo.save.mockResolvedValue(entity);
      membershipRepo.save.mockResolvedValue({} as any);

      const result = await repository.save(space);

      expect(result.id.value).toBe(space.id.value);
    });
  });

  describe('findById()', () => {
    it('should return a SpaceAggregate when entity is found', async () => {
      const entity = buildSpaceEntity();

      spaceRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(SPACE_ID);

      expect(spaceRepo.findOne).toHaveBeenCalledWith({
        where: { id: SPACE_ID },
      });
      expect(result).not.toBeNull();
      expect(result?.id.value).toBe(SPACE_ID);
    });

    it('should return null when entity is not found', async () => {
      spaceRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('delete()', () => {
    it('should call TypeORM delete with the correct id', async () => {
      spaceRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(SPACE_ID);

      expect(spaceRepo.delete).toHaveBeenCalledTimes(1);
      expect(spaceRepo.delete).toHaveBeenCalledWith(SPACE_ID);
    });

    it('should resolve without throwing when delete succeeds', async () => {
      spaceRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await expect(repository.delete(SPACE_ID)).resolves.not.toThrow();
    });
  });
});
