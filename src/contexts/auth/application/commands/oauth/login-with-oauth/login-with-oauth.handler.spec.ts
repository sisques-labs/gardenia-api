import { EncryptionService } from '@contexts/auth/application/services/encryption/encryption.service';
import { TokenService } from '@contexts/auth/application/services/token.service';
import { GenerateRefreshTokenService } from '@contexts/auth/application/services/write/generate-refresh-token/generate-refresh-token.service';
import { HashRefreshTokenService } from '@contexts/auth/application/services/write/hash-refresh-token/hash-refresh-token.service';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { OAuthIdentityBuilder } from '@contexts/auth/domain/builders/oauth-identity.builder';
import { OAuthIdentityAggregate } from '@contexts/auth/domain/aggregates/oauth-identity.aggregate';
import { OAuthEmailNotVerifiedException } from '@contexts/auth/domain/exceptions/oauth-email-not-verified.exception';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { IAuthSessionWriteRepository } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
import { IOAuthIdentityWriteRepository } from '@contexts/auth/domain/repositories/write/oauth-identity-write.repository';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { ISpaceProvisioningPort } from '@contexts/auth/application/ports/space-provisioning.port';
import { IUserProvisioningPort } from '@contexts/auth/application/ports/user-provisioning.port';
import { EventBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { LoginWithOAuthCommandHandler } from './login-with-oauth.handler';
import {
  LoginWithOAuthCommand,
  LoginWithOAuthCommandInput,
} from './login-with-oauth.command';

const userId = '550e8400-e29b-41d4-a716-446655440000';
const existingUserId = '660e8400-e29b-41d4-a716-446655440001';

const makeInput = (
  overrides?: Partial<LoginWithOAuthCommandInput>,
): LoginWithOAuthCommandInput => ({
  provider: 'google',
  providerUserId: 'google-abc',
  email: 'user@example.com',
  emailVerified: true,
  accessToken: 'access',
  refreshToken: 'refresh',
  tokenExpiresAt: null,
  ...overrides,
});

const makeExistingIdentity = (): OAuthIdentityAggregate =>
  new OAuthIdentityBuilder()
    .withId('770e8400-e29b-41d4-a716-446655440002')
    .withUserId(userId)
    .withProvider('google')
    .withProviderUserId('google-abc')
    .withEmail('user@example.com')
    .withEmailVerified(true)
    .build();

const makeOAuthRepo = (): jest.Mocked<IOAuthIdentityWriteRepository> => ({
  findByProviderUserId: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
  findById: jest.fn(),
  findByCriteria: jest.fn(),
});

const makeAccountRepo = (): jest.Mocked<IAccountWriteRepository> => ({
  findByEmail: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  findByCriteria: jest.fn(),
});

const makeSessionRepo = (): jest.Mocked<IAuthSessionWriteRepository> => ({
  findByTokenHash: jest.fn(),
  revokeAllByUserId: jest.fn(),
  rotate: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
  findById: jest.fn(),
  findByCriteria: jest.fn(),
});

describe('LoginWithOAuthCommandHandler', () => {
  let handler: LoginWithOAuthCommandHandler;
  let oauthRepo: jest.Mocked<IOAuthIdentityWriteRepository>;
  let accountRepo: jest.Mocked<IAccountWriteRepository>;
  let sessionRepo: jest.Mocked<IAuthSessionWriteRepository>;
  let spaceProvisioningPort: jest.Mocked<ISpaceProvisioningPort>;
  let userProvisioningPort: jest.Mocked<IUserProvisioningPort>;
  let spaceContext: jest.Mocked<SpaceContext>;

  beforeEach(() => {
    oauthRepo = makeOAuthRepo();
    accountRepo = makeAccountRepo();
    sessionRepo = makeSessionRepo();

    spaceProvisioningPort = {
      createDefaultSpace: jest.fn().mockResolvedValue('space-id-123'),
    } as jest.Mocked<ISpaceProvisioningPort>;

    userProvisioningPort = {
      createUser: jest.fn().mockResolvedValue(undefined),
      deleteUser: jest.fn(),
    } as jest.Mocked<IUserProvisioningPort>;

    spaceContext = {
      run: jest
        .fn()
        .mockImplementation((_spaceId: string, fn: () => Promise<void>) =>
          fn(),
        ),
    } as unknown as jest.Mocked<SpaceContext>;

    const encryptionService = {
      encrypt: jest.fn().mockImplementation((v: string) => `enc:${v}`),
    } as unknown as EncryptionService;

    const tokenService = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
    } as unknown as TokenService;

    const generateRefreshTokenService = {
      execute: jest.fn().mockResolvedValue('plain-refresh-token'),
    } as unknown as GenerateRefreshTokenService;

    const hashRefreshTokenService = {
      execute: jest.fn().mockResolvedValue('a3b4c5d6'.repeat(8)),
    } as unknown as HashRefreshTokenService;

    const authSessionBuilder = new AuthSessionBuilder();
    const oauthIdentityBuilder = new OAuthIdentityBuilder();

    const eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as EventBus;

    const configService = {
      get: jest.fn().mockReturnValue(30),
    } as unknown as ConfigService;

    handler = new LoginWithOAuthCommandHandler(
      eventBus,
      oauthRepo,
      accountRepo,
      sessionRepo,
      encryptionService,
      tokenService,
      generateRefreshTokenService,
      hashRefreshTokenService,
      authSessionBuilder,
      oauthIdentityBuilder,
      spaceProvisioningPort,
      userProvisioningPort,
      spaceContext,
      configService,
    );
  });

  it('should return tokens for a returning OAuth user (existing identity)', async () => {
    oauthRepo.findByProviderUserId.mockResolvedValue(makeExistingIdentity());

    const result = await handler.execute(
      new LoginWithOAuthCommand(makeInput()),
    );

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('plain-refresh-token');
    expect(sessionRepo.save).toHaveBeenCalledTimes(1);
    // Should NOT create a new user
    expect(spaceProvisioningPort.createDefaultSpace).not.toHaveBeenCalled();
    expect(userProvisioningPort.createUser).not.toHaveBeenCalled();
  });

  it('should auto-link email and issue session for existing account with verified email', async () => {
    oauthRepo.findByProviderUserId.mockResolvedValue(null);
    // Simulate existing account found by email
    const fakeAccount = {
      userId: { value: existingUserId },
      email: { value: 'user@example.com' },
      appRole: { value: 'user' },
    } as unknown as AccountAggregate;
    accountRepo.findByEmail.mockResolvedValue(fakeAccount);

    const result = await handler.execute(
      new LoginWithOAuthCommand(makeInput()),
    );

    expect(result.accessToken).toBe('mock-access-token');
    expect(oauthRepo.save).toHaveBeenCalledTimes(1);
    const savedIdentity = oauthRepo.save.mock.calls[0][0];
    expect(savedIdentity.userId.value).toBe(existingUserId);
    // Should NOT provision a new user
    expect(spaceProvisioningPort.createDefaultSpace).not.toHaveBeenCalled();
    expect(userProvisioningPort.createUser).not.toHaveBeenCalled();
  });

  it('should provision a new user and issue session for brand new OAuth user', async () => {
    oauthRepo.findByProviderUserId.mockResolvedValue(null);
    accountRepo.findByEmail.mockResolvedValue(null);

    const result = await handler.execute(
      new LoginWithOAuthCommand(makeInput()),
    );

    expect(result.accessToken).toBe('mock-access-token');
    // Space + user provisioning should be called once each
    expect(spaceProvisioningPort.createDefaultSpace).toHaveBeenCalledTimes(1);
    expect(userProvisioningPort.createUser).toHaveBeenCalledTimes(1);
    expect(oauthRepo.save).toHaveBeenCalledTimes(1);
    expect(sessionRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw OAuthEmailNotVerifiedException for unverified email with no existing identity', async () => {
    oauthRepo.findByProviderUserId.mockResolvedValue(null);
    accountRepo.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(
        new LoginWithOAuthCommand(makeInput({ emailVerified: false })),
      ),
    ).rejects.toThrow(OAuthEmailNotVerifiedException);

    expect(sessionRepo.save).not.toHaveBeenCalled();
  });
});
