import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { SpaceContext } from '../../../../../shared/space-context/space-context.service';
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';
import { AccountTypeOrmMapper } from './account-typeorm.mapper';
import { AccountTypeOrmReadRepository } from './account-typeorm-read.repository';
import { AccountEntity } from './account.entity';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (overrides: Partial<AccountEntity> = {}): AccountEntity => {
  const entity = new AccountEntity();
  entity.id = '550e8400-e29b-41d4-a716-446655440000';
  entity.userId = '660e8400-e29b-41d4-a716-446655440001';
  entity.spaceId = SPACE_ID;
  entity.email = 'test@example.com';
  entity.passwordHash = 'hashed-password';
  entity.createdAt = new Date('2024-01-01');
  entity.updatedAt = new Date('2024-01-01');
  return Object.assign(entity, overrides);
};

const buildCriteria = (
  page: number,
  perPage: number,
  sorts: { field: string; direction: 'ASC' | 'DESC' }[] = [],
): Criteria => {
  return {
    pagination: { page, perPage },
    sorts,
    filters: [],
  } as unknown as Criteria;
};

const buildCriteriaWithFilter = (field: string, value: string): Criteria => {
  return {
    pagination: { page: 1, perPage: 10 },
    sorts: [],
    filters: [{ field, operator: FilterOperator.EQUALS, value }],
  } as unknown as Criteria;
};

describe('AccountTypeOrmReadRepository', () => {
  let repository: AccountTypeOrmReadRepository;
  let typeOrmRepo: jest.Mocked<Repository<AccountEntity>>;
  let mapper: AccountTypeOrmMapper;
  let spaceContext: jest.Mocked<SpaceContext>;

  beforeEach(() => {
    jest.clearAllMocks();

    typeOrmRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    } as unknown as jest.Mocked<Repository<AccountEntity>>;

    spaceContext = {
      run: jest.fn(),
      get: jest.fn().mockReturnValue(SPACE_ID),
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as unknown as jest.Mocked<SpaceContext>;

    const builder = new AccountBuilder();
    mapper = new AccountTypeOrmMapper(builder);

    repository = new AccountTypeOrmReadRepository(
      typeOrmRepo,
      mapper,
      spaceContext,
    );
  });

  describe('tenant proxy', () => {
    it('should inject spaceId into findOne where clause', async () => {
      const entity = buildEntity();
      typeOrmRepo.findOne.mockResolvedValue(entity);

      await repository.findById('550e8400-e29b-41d4-a716-446655440000');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ spaceId: SPACE_ID }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should call mapper.toViewModel and return AccountViewModel when entity found', async () => {
      const entity = buildEntity();
      typeOrmRepo.findOne.mockResolvedValue(entity);
      const toViewModelSpy = jest.spyOn(mapper, 'toViewModel');

      const result = await repository.findById(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      expect(toViewModelSpy).toHaveBeenCalledWith(entity);
      expect(result).toBeInstanceOf(AccountViewModel);
      expect(result!.email).toBe(entity.email);
    });

    it('should return null when no entity found', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria', () => {
    it('should call findAndCount with correct skip/take/order for page 2 / perPage 10 with a sort', async () => {
      const entity = buildEntity();
      typeOrmRepo.findAndCount.mockResolvedValue([[entity], 20]);
      const criteria = buildCriteria(2, 10, [
        { field: 'createdAt', direction: 'ASC' },
      ]);

      await repository.findByCriteria(criteria);

      expect(typeOrmRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ spaceId: SPACE_ID }),
          skip: 10,
          take: 10,
          order: { createdAt: 'ASC' },
        }),
      );
    });

    it('should call findAndCount with where: { userId } when a userId filter is passed', async () => {
      typeOrmRepo.findAndCount.mockResolvedValue([[], 0]);
      const criteria = buildCriteriaWithFilter('userId', 'u-123');

      await repository.findByCriteria(criteria);

      expect(typeOrmRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'u-123',
            spaceId: SPACE_ID,
          }),
        }),
      );
    });

    it('should call findAndCount with spaceId in where when no other filters are passed', async () => {
      typeOrmRepo.findAndCount.mockResolvedValue([[], 0]);
      const criteria = buildCriteria(1, 10);

      await repository.findByCriteria(criteria);

      expect(typeOrmRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ spaceId: SPACE_ID }),
        }),
      );
    });

    it('should return PaginatedResult with items=[] and total=0 when no entities exist', async () => {
      typeOrmRepo.findAndCount.mockResolvedValue([[], 0]);
      const criteria = buildCriteria(1, 10);

      const result = await repository.findByCriteria(criteria);

      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should compute skip=0 and take=5 for page 1 / perPage 5 (offset pagination)', async () => {
      typeOrmRepo.findAndCount.mockResolvedValue([[], 0]);
      const criteria = buildCriteria(1, 5);

      await repository.findByCriteria(criteria);

      expect(typeOrmRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 5 }),
      );
    });

    it('should pass direction DESC in the order object when sorting DESC', async () => {
      typeOrmRepo.findAndCount.mockResolvedValue([[], 0]);
      const criteria = buildCriteria(1, 10, [
        { field: 'email', direction: 'DESC' },
      ]);

      await repository.findByCriteria(criteria);

      expect(typeOrmRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { email: 'DESC' } }),
      );
    });

    it('should not expose passwordHash on any returned AccountViewModel', async () => {
      const entity = buildEntity();
      typeOrmRepo.findAndCount.mockResolvedValue([[entity], 1]);
      const criteria = buildCriteria(1, 10);

      const result = await repository.findByCriteria(criteria);

      result.items.forEach((item) => {
        expect(item).not.toHaveProperty('passwordHash');
      });
    });
  });
});
