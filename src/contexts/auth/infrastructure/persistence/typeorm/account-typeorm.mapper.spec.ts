import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AccountEntity } from './account.entity';
import { AccountTypeOrmMapper } from './account-typeorm.mapper';

const buildEntity = (appRole = 'user'): AccountEntity => {
  const entity = new AccountEntity();
  entity.id = '550e8400-e29b-41d4-a716-446655440000';
  entity.userId = '660e8400-e29b-41d4-a716-446655440001';
  entity.spaceId = '770e8400-e29b-41d4-a716-446655440002';
  entity.email = 'test@example.com';
  entity.passwordHash = 'hashed-password';
  entity.appRole = appRole;
  entity.createdAt = new Date('2024-01-01');
  entity.updatedAt = new Date('2024-01-01');
  return entity;
};

const buildAggregate = (): AccountAggregate =>
  new AccountBuilder()
    .withId('550e8400-e29b-41d4-a716-446655440000')
    .withUserId('660e8400-e29b-41d4-a716-446655440001')
    .withEmail('test@example.com')
    .withPasswordHash('hashed-password')
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('AccountTypeOrmMapper', () => {
  let mapper: AccountTypeOrmMapper;

  beforeEach(() => {
    const builder = new AccountBuilder();
    mapper = new AccountTypeOrmMapper(builder);
  });

  describe('toAggregate', () => {
    it('should return an AccountAggregate with VOs wrapping entity primitives', () => {
      const entity = buildEntity();

      const result = mapper.toAggregate(entity);

      expect(result).toBeInstanceOf(AccountAggregate);
      expect(result.id.value).toBe(entity.id);
      expect(result.userId.value).toBe(entity.userId);
      expect(result.email.value).toBe(entity.email);
      expect(result.passwordHash.value).toBe(entity.passwordHash);
    });

    it('should map app_role from entity to appRole VO on aggregate', () => {
      const entity = buildEntity('admin');

      const result = mapper.toAggregate(entity);

      expect(result.appRole.value).toBe('admin');
      expect(result.appRole.isAdmin()).toBe(true);
    });

    it('should map app_role "user" from entity to USER role on aggregate', () => {
      const entity = buildEntity('user');

      const result = mapper.toAggregate(entity);

      expect(result.appRole.value).toBe('user');
      expect(result.appRole.isAdmin()).toBe(false);
    });
  });

  describe('toEntity', () => {
    it('should return an AccountEntity with plain primitives from aggregate', () => {
      const aggregate = buildAggregate();

      const result = mapper.toEntity(aggregate);

      expect(result).toBeInstanceOf(AccountEntity);
      expect(result.id).toBe(aggregate.id.value);
      expect(result.userId).toBe(aggregate.userId.value);
      expect(result.email).toBe(aggregate.email.value);
      expect(result.passwordHash).toBe(aggregate.passwordHash.value);
    });

    it('should include appRole in entity — round-trip app_role', () => {
      const aggregate = buildAggregate();

      const result = mapper.toEntity(aggregate);

      expect(result.appRole).toBe('user');
    });
  });

  describe('toViewModel', () => {
    it('should return an AccountViewModel with userId and email as strings, without passwordHash', () => {
      const entity = buildEntity();

      const result = mapper.toViewModel(entity);

      expect(result).toBeInstanceOf(AccountViewModel);
      expect(result.userId).toBe(entity.userId);
      expect(result.email).toBe(entity.email);
      expect((result as any).passwordHash).toBeUndefined();
    });
  });
});
