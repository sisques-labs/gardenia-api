import { Criteria, SortDirection } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { SpaceInvitationBuilder } from '@contexts/spaces/domain/builders/space-invitation.builder';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { SpaceInvitationEntity } from '../entities/space-invitation.entity';
import { SpaceInvitationTypeOrmMapper } from '../mappers/space-invitation-typeorm.mapper';
import { SpaceInvitationTypeOrmReadRepository } from './space-invitation-typeorm-read.repository';

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

describe('SpaceInvitationTypeOrmReadRepository', () => {
  let repository: SpaceInvitationTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<SpaceInvitationEntity>>;
  let mapper: SpaceInvitationTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    } as unknown as jest.Mocked<Repository<SpaceInvitationEntity>>;

    mapper = new SpaceInvitationTypeOrmMapper(new SpaceInvitationBuilder());

    repository = new SpaceInvitationTypeOrmReadRepository(rawRepo, mapper);
  });

  describe('findById()', () => {
    it('returns SpaceInvitationViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(INVITATION_ID);

      expect(result).toBeInstanceOf(SpaceInvitationViewModel);
      expect(result!.id).toBe(INVITATION_ID);
      expect(rawRepo.findOne).toHaveBeenCalledWith({
        where: { id: INVITATION_ID },
      });
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCode()', () => {
    it('normalizes the code and returns the view model', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findByCode('abc-123');

      expect(rawRepo.findOne).toHaveBeenCalledWith({
        where: { code: 'ABC123' },
      });
      expect(result).toBeInstanceOf(SpaceInvitationViewModel);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByCode('unknown');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated results without filters', async () => {
      rawRepo.findAndCount.mockResolvedValue([[buildEntity()], 1]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(SpaceInvitationViewModel);
      expect(result.total).toBe(1);
      expect(rawRepo.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: {},
      });
    });

    it('builds the where clause from filters and order from sorts', async () => {
      rawRepo.findAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [{ field: 'spaceId', operator: 'eq' as any, value: SPACE_ID }],
          [{ field: 'createdAt', direction: SortDirection.DESC }],
          { page: 2, perPage: 5 },
        ),
      );

      expect(rawRepo.findAndCount).toHaveBeenCalledWith({
        where: { spaceId: SPACE_ID },
        skip: 5,
        take: 5,
        order: { createdAt: SortDirection.DESC },
      });
    });

    it('falls back to an empty where clause when filters is null', async () => {
      rawRepo.findAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(null as any, undefined, undefined),
      );

      expect(rawRepo.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: {},
      });
    });

    it('returns empty result when no invitations match', async () => {
      rawRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('save()', () => {
    it('resolves without doing anything', async () => {
      await expect(
        repository.save(mapper.toViewModel(buildEntity())),
      ).resolves.toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('resolves without doing anything', async () => {
      await expect(repository.delete(INVITATION_ID)).resolves.toBeUndefined();
    });
  });
});
