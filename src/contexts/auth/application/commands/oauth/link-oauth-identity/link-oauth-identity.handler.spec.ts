import { OAuthUserProfile } from '@contexts/auth/application/ports/oauth-user-profile';
import { TokenEncryptionService } from '@contexts/auth/application/services/oauth/token-encryption.service';
import { OAuthIdentityBuilder } from '@contexts/auth/domain/builders/oauth-identity.builder';
import { OAuthIdentityEntity } from '@contexts/auth/domain/entities/oauth-identity/oauth-identity.entity';
import { OAuthIdentityAlreadyLinkedException } from '@contexts/auth/domain/exceptions/oauth-identity-already-linked.exception';
import { IOAuthIdentityWriteRepository } from '@contexts/auth/domain/repositories/write/oauth-identity-write.repository';
import { LinkOAuthIdentityCommandHandler } from './link-oauth-identity.handler';
import { LinkOAuthIdentityCommand } from './link-oauth-identity.command';

const makeRepo = (): jest.Mocked<IOAuthIdentityWriteRepository> => ({
  findByProviderUserId: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  findByCriteria: jest.fn(),
});

const makeEncryptionService = (): jest.Mocked<TokenEncryptionService> =>
  ({
    encrypt: jest.fn().mockImplementation((v: string) => `enc:${v}`),
    decrypt: jest.fn(),
  }) as unknown as jest.Mocked<TokenEncryptionService>;

const userId = '550e8400-e29b-41d4-a716-446655440000';
const otherUserId = '660e8400-e29b-41d4-a716-446655440001';

const makeProfile = (): OAuthUserProfile => ({
  provider: 'google',
  providerUserId: 'google-123',
  email: 'user@example.com',
  emailVerified: true,
  displayName: 'Test User',
  rawTokens: {
    accessToken: 'access-token-value',
    refreshToken: 'refresh-token-value',
    expiresAt: null,
  },
});

const makeExistingIdentity = (forUserId: string): OAuthIdentityEntity => {
  return new OAuthIdentityBuilder()
    .withId('770e8400-e29b-41d4-a716-446655440002')
    .withUserId(forUserId)
    .withProvider('google')
    .withProviderUserId('google-123')
    .withEmail('user@example.com')
    .withEmailVerified(true)
    .build();
};

describe('LinkOAuthIdentityCommandHandler', () => {
  let handler: LinkOAuthIdentityCommandHandler;
  let repo: jest.Mocked<IOAuthIdentityWriteRepository>;
  let encryptionService: jest.Mocked<TokenEncryptionService>;

  beforeEach(() => {
    repo = makeRepo();
    encryptionService = makeEncryptionService();
    handler = new LinkOAuthIdentityCommandHandler(repo, encryptionService);
  });

  it('should save a new oauth identity for happy path', async () => {
    repo.findByProviderUserId.mockResolvedValue(null);
    repo.save.mockResolvedValue(expect.anything());

    await handler.execute(new LinkOAuthIdentityCommand(userId, makeProfile()));

    expect(repo.save).toHaveBeenCalledTimes(1);
    const savedEntity = repo.save.mock.calls[0][0];
    expect(savedEntity.userId.value).toBe(userId);
    expect(savedEntity.provider.value).toBe('google');
  });

  it('should throw OAuthIdentityAlreadyLinkedException when identity is linked to another user', async () => {
    repo.findByProviderUserId.mockResolvedValue(
      makeExistingIdentity(otherUserId),
    );

    await expect(
      handler.execute(new LinkOAuthIdentityCommand(userId, makeProfile())),
    ).rejects.toThrow(OAuthIdentityAlreadyLinkedException);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should be a no-op when the identity is already linked to THIS user', async () => {
    repo.findByProviderUserId.mockResolvedValue(makeExistingIdentity(userId));

    await handler.execute(new LinkOAuthIdentityCommand(userId, makeProfile()));

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should encrypt provider tokens before saving', async () => {
    repo.findByProviderUserId.mockResolvedValue(null);
    repo.save.mockResolvedValue(expect.anything());

    await handler.execute(new LinkOAuthIdentityCommand(userId, makeProfile()));

    expect(encryptionService.encrypt).toHaveBeenCalledWith(
      'access-token-value',
    );
    expect(encryptionService.encrypt).toHaveBeenCalledWith(
      'refresh-token-value',
    );
    const savedEntity = repo.save.mock.calls[0][0];
    expect(savedEntity.accessTokenEnc).toBe('enc:access-token-value');
  });
});
