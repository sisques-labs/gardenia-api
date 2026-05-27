import { AccountTypeOrmWriteRepository } from './account-typeorm-write.repository';
import { AccountEntity } from './account.entity';
import { AccountTypeOrmMapper } from './account-typeorm.mapper';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { Repository } from 'typeorm';

const buildAccount = (): AccountAggregate =>
  new AccountBuilder()
    .withId('550e8400-e29b-41d4-a716-446655440000')
    .withUserId('660e8400-e29b-41d4-a716-446655440001')
    .withEmail('test@example.com')
    .withPasswordHash('hashed-password')
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

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

describe('AccountTypeOrmWriteRepository', () => {
  let repository: AccountTypeOrmWriteRepository;
  let typeOrmRepo: jest.Mocked<Repository<AccountEntity>>;
  let mapper: AccountTypeOrmMapper;

  beforeEach(() => {
    typeOrmRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<AccountEntity>>;

    const builder = new AccountBuilder();
    mapper = new AccountTypeOrmMapper(builder);

    repository = new AccountTypeOrmWriteRepository(typeOrmRepo, mapper);
  });

  describe('save', () => {
    it('should return an AccountAggregate after saving', async () => {
      const account = buildAccount();
      const entity = buildEntity();
      typeOrmRepo.save.mockResolvedValue(entity);

      const result = await repository.save(account);

      expect(result).toBeInstanceOf(AccountAggregate);
      expect(result.id.value).toBe(account.id.value);
      expect(result.email.value).toBe(account.email.value);
    });
  });

  describe('findById', () => {
    it('should return AccountAggregate when entity exists', async () => {
      const entity = buildEntity();
      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      expect(result).toBeInstanceOf(AccountAggregate);
      expect(result!.id.value).toBe(entity.id);
    });

    it('should return null when entity does not exist', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should call repo.delete with the given id', async () => {
      typeOrmRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete('550e8400-e29b-41d4-a716-446655440000');

      expect(typeOrmRepo.delete).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return AccountAggregate when entity with email exists', async () => {
      const entity = buildEntity();
      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toBeInstanceOf(AccountAggregate);
      expect(result!.email.value).toBe('test@example.com');
    });

    it('should return null when no entity with given email exists', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });
});
