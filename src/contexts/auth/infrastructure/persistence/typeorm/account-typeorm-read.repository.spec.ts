import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { Repository } from 'typeorm';
import { AccountTypeOrmMapper } from './account-typeorm.mapper';
import { AccountTypeOrmReadRepository } from './account-typeorm-read.repository';
import { AccountEntity } from './account.entity';

const buildEntity = (): AccountEntity => {
  const entity = new AccountEntity();
  entity.id = '550e8400-e29b-41d4-a716-446655440000';
  entity.userId = '660e8400-e29b-41d4-a716-446655440001';
  entity.email = 'test@example.com';
  entity.passwordHash = 'hashed-password';
  entity.createdAt = new Date('2024-01-01');
  entity.updatedAt = new Date('2024-01-01');
  return entity;
};

describe('AccountTypeOrmReadRepository', () => {
  let repository: AccountTypeOrmReadRepository;
  let typeOrmRepo: jest.Mocked<Repository<AccountEntity>>;
  let mapper: AccountTypeOrmMapper;

  beforeEach(() => {
    typeOrmRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<AccountEntity>>;

    const builder = new AccountBuilder();
    mapper = new AccountTypeOrmMapper(builder);

    repository = new AccountTypeOrmReadRepository(typeOrmRepo, mapper);
  });

  describe('findById', () => {
    it('should call mapper.toViewModel and return AccountViewModel when entity found', async () => {
      const entity = buildEntity();
      typeOrmRepo.findOne.mockResolvedValue(entity);
      const toViewModelSpy = jest.spyOn(mapper, 'toViewModel');

      const result = await repository.findById('550e8400-e29b-41d4-a716-446655440000');

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
    it('should exist as a method on the repository', () => {
      expect(typeof repository.findByCriteria).toBe('function');
    });
  });
});
