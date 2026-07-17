import { Criteria } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { SpaceInvitationBuilder } from '@contexts/spaces/domain/builders/space-invitation.builder';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceInvitationEntity } from '../entities/space-invitation.entity';
import { SpaceInvitationTypeOrmMapper } from '../mappers/space-invitation-typeorm.mapper';
import { SpaceInvitationTypeOrmWriteRepository } from './space-invitation-typeorm-write.repository';

const INVITATION_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '660e8400-e29b-41d4-a716-446655440001';
const USER_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<SpaceInvitationEntity> = {},
): SpaceInvitationEntity => {
  const e = new SpaceInvitationEntity();
  e.id = INVITATION_ID;
  e.spaceId = SPACE_ID;
  e.createdByUserId = USER_ID;
  e.role = MembershipRoleEnum.MEMBER;
  e.code = 'ABC123';
  e.displayCode = 'ABC-123';
  e.qrId = null;
  e.expiresAt = new Date('2026-12-31');
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

const buildAggregate = () =>
  new SpaceInvitationBuilder()
    .withId(INVITATION_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedByUserId(USER_ID)
    .withRole(MembershipRoleEnum.MEMBER)
    .withCode('ABC123')
    .withDisplayCode('ABC-123')
    .withQrId(null)
    .withExpiresAt(new Date('2026-12-31'))
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('SpaceInvitationTypeOrmWriteRepository', () => {
  let repository: SpaceInvitationTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<SpaceInvitationEntity>>;
  let mapper: SpaceInvitationTypeOrmMapper;
  let spaceContext: { require: jest.Mock };

  beforeEach(() => {
    rawRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<SpaceInvitationEntity>>;

    mapper = new SpaceInvitationTypeOrmMapper(new SpaceInvitationBuilder());

    spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    };

    repository = new SpaceInvitationTypeOrmWriteRepository(
      mapper,
      rawRepo,
      spaceContext as any,
    );
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(INVITATION_ID);

      expect(result).not.toBeNull();
      expect(result!.id.value).toBe(INVITATION_ID);
      expect(rawRepo.findOne).toHaveBeenCalledWith({
        where: { id: INVITATION_ID, spaceId: SPACE_ID },
      });
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCode()', () => {
    it('normalizes the code and queries the raw repository directly', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findByCode('abc-123');

      expect(rawRepo.findOne).toHaveBeenCalledWith({
        where: { code: 'ABC123' },
      });
      expect(result!.code.value).toBe('ABC123');
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByCode('unknown');

      expect(result).toBeNull();
    });
  });

  describe('save()', () => {
    it('persists the entity and returns the mapped aggregate', async () => {
      rawRepo.save.mockResolvedValue(buildEntity());
      const aggregate = buildAggregate();

      const result = await repository.save(aggregate);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
      expect(result.id.value).toBe(INVITATION_ID);
    });
  });

  describe('findByCriteria()', () => {
    it('throws because it is not implemented', async () => {
      await expect(
        repository.findByCriteria(
          new Criteria(undefined, undefined, undefined),
        ),
      ).rejects.toThrow('Method not implemented.');
    });
  });

  describe('delete()', () => {
    it('calls delete on the tenant-scoped repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(INVITATION_ID);

      expect(rawRepo.delete).toHaveBeenCalledWith({
        id: INVITATION_ID,
        spaceId: SPACE_ID,
      });
    });
  });
});
