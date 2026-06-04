import { OAuthIdentityBuilder } from '@contexts/auth/domain/builders/oauth-identity.builder';
import { OAuthIdentityAggregate } from '@contexts/auth/domain/aggregates/oauth-identity.aggregate';
import { OAuthIdentityTypeOrmMapper } from '../mappers/oauth-identity-typeorm.mapper';
import { OAuthIdentityTypeOrmEntity } from '../entities/oauth-identity.entity';
import { OAuthIdentityTypeOrmWriteRepository } from './oauth-identity-typeorm-write.repository';
import { Repository } from 'typeorm';

const makeRepo = (): jest.Mocked<Repository<OAuthIdentityTypeOrmEntity>> =>
  ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<Repository<OAuthIdentityTypeOrmEntity>>;

const makeMapper = (): jest.Mocked<OAuthIdentityTypeOrmMapper> =>
  ({
    toDomain: jest.fn(),
    toPersistence: jest.fn(),
  }) as unknown as jest.Mocked<OAuthIdentityTypeOrmMapper>;

const validId = '550e8400-e29b-41d4-a716-446655440000';
const validUserId = '660e8400-e29b-41d4-a716-446655440001';

const makeDomainAggregate = (): OAuthIdentityAggregate =>
  new OAuthIdentityBuilder()
    .withId(validId)
    .withUserId(validUserId)
    .withProvider('google')
    .withProviderUserId('google-123')
    .build();

const makeTypeOrmEntity = (): OAuthIdentityTypeOrmEntity => {
  const e = new OAuthIdentityTypeOrmEntity();
  e.id = validId;
  e.userId = validUserId;
  e.provider = 'google';
  e.providerUserId = 'google-123';
  e.email = null;
  e.emailVerified = false;
  e.accessTokenEnc = null;
  e.refreshTokenEnc = null;
  e.tokenExpiresAt = null;
  e.createdAt = new Date();
  e.updatedAt = new Date();
  return e;
};

describe('OAuthIdentityTypeOrmWriteRepository', () => {
  let repository: OAuthIdentityTypeOrmWriteRepository;
  let repo: jest.Mocked<Repository<OAuthIdentityTypeOrmEntity>>;
  let mapper: jest.Mocked<OAuthIdentityTypeOrmMapper>;

  beforeEach(() => {
    repo = makeRepo();
    mapper = makeMapper();
    repository = new OAuthIdentityTypeOrmWriteRepository(repo as any, mapper);
  });

  describe('findByProviderUserId', () => {
    it('should call repo.findOne with correct where clause', async () => {
      const typeOrmEntity = makeTypeOrmEntity();
      const domainAggregate = makeDomainAggregate();
      repo.findOne.mockResolvedValue(typeOrmEntity);
      mapper.toDomain.mockReturnValue(domainAggregate);

      const result = await repository.findByProviderUserId(
        'google',
        'google-123',
      );

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { provider: 'google', providerUserId: 'google-123' },
      });
      expect(result).toBe(domainAggregate);
    });

    it('should return null when entity not found', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await repository.findByProviderUserId('google', 'unknown');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return array of domain aggregates', async () => {
      const typeOrmEntity = makeTypeOrmEntity();
      const domainAggregate = makeDomainAggregate();
      repo.find.mockResolvedValue([typeOrmEntity]);
      mapper.toDomain.mockReturnValue(domainAggregate);

      const results = await repository.findByUserId(validUserId);

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: validUserId },
      });
      expect(results).toHaveLength(1);
      expect(results[0]).toBe(domainAggregate);
    });
  });
});
