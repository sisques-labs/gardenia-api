import { EventBus } from '@nestjs/cqrs';

import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { InvalidRefreshTokenException } from '@contexts/auth/domain/exceptions/invalid-refresh-token.exception';
import { RefreshTokenReuseDetectedException } from '@contexts/auth/domain/exceptions/refresh-token-reuse-detected.exception';
import { IAuthSessionWriteRepository } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
import { TokenService } from '@contexts/auth/application/services/token.service';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { GenerateRefreshTokenService } from '@contexts/auth/application/services/write/generate-refresh-token/generate-refresh-token.service';
import { HashRefreshTokenService } from '@contexts/auth/application/services/write/hash-refresh-token/hash-refresh-token.service';

import { RefreshTokenCommand } from './refresh-token.command';
import { RefreshTokenCommandHandler } from './refresh-token.handler';

const buildActiveSession = (overrides?: {
  expiresAt?: Date;
  revokedAt?: Date | null;
}) =>
  new AuthSessionBuilder()
    .withId('a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1')
    .withUserId('660e8400-e29b-41d4-a716-446655440001')
    .withTokenHash('a'.repeat(64))
    .withExpiresAt(
      overrides?.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    )
    .withRevokedAt(overrides?.revokedAt ?? null)
    .build();

const buildAccount = () =>
  new AccountBuilder()
    .withId('550e8400-e29b-41d4-a716-446655440000')
    .withUserId('660e8400-e29b-41d4-a716-446655440001')
    .withEmail('test@example.com')
    .withPasswordHash('hashed-password')
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('RefreshTokenCommandHandler', () => {
  let handler: RefreshTokenCommandHandler;
  let sessionRepo: jest.Mocked<IAuthSessionWriteRepository>;
  let accountRepo: jest.Mocked<IAccountWriteRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let eventBus: jest.Mocked<EventBus>;
  let generateRefreshTokenService: jest.Mocked<GenerateRefreshTokenService>;
  let hashRefreshTokenService: jest.Mocked<HashRefreshTokenService>;

  beforeEach(() => {
    sessionRepo = {
      save: jest.fn(),
      findByTokenHash: jest.fn(),
      findById: jest.fn(),
      revokeAllByUserId: jest.fn().mockResolvedValue(1),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IAuthSessionWriteRepository>;

    accountRepo = {
      findByUserId: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IAccountWriteRepository>;

    tokenService = {
      sign: jest.fn().mockReturnValue('new-access-token'),
    } as unknown as jest.Mocked<TokenService>;

    generateRefreshTokenService = {
      execute: jest.fn().mockResolvedValue('new-refresh-token'),
    } as unknown as jest.Mocked<GenerateRefreshTokenService>;

    hashRefreshTokenService = {
      execute: jest
        .fn()
        .mockResolvedValueOnce('a'.repeat(64))
        .mockResolvedValueOnce('b'.repeat(64)),
    } as unknown as jest.Mocked<HashRefreshTokenService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new RefreshTokenCommandHandler(
      eventBus,
      sessionRepo,
      accountRepo,
      tokenService,
      new AuthSessionBuilder(),
      generateRefreshTokenService,
      hashRefreshTokenService,
    );
  });

  it('throws InvalidRefreshTokenException when session is not found', async () => {
    sessionRepo.findByTokenHash.mockResolvedValue(null);

    const command = new RefreshTokenCommand({
      refreshToken: 'some-plain-token',
    });

    await expect(handler.execute(command)).rejects.toThrow(
      InvalidRefreshTokenException,
    );
  });

  it('throws InvalidRefreshTokenException when session is expired', async () => {
    const expiredSession = buildActiveSession({
      expiresAt: new Date(Date.now() - 1000),
    });
    sessionRepo.findByTokenHash.mockResolvedValue(expiredSession);

    const command = new RefreshTokenCommand({
      refreshToken: 'some-plain-token',
    });

    await expect(handler.execute(command)).rejects.toThrow(
      InvalidRefreshTokenException,
    );
  });

  it('triggers reuse detection when session is already revoked', async () => {
    const revokedSession = buildActiveSession({
      revokedAt: new Date(Date.now() - 5000),
    });
    sessionRepo.findByTokenHash.mockResolvedValue(revokedSession);

    const command = new RefreshTokenCommand({
      refreshToken: 'some-plain-token',
    });

    await expect(handler.execute(command)).rejects.toThrow(
      RefreshTokenReuseDetectedException,
    );
    expect(sessionRepo.revokeAllByUserId).toHaveBeenCalledWith(
      revokedSession.userId.value,
    );
  });

  it('rotates token on happy path: revokes old session, creates new one, returns accessToken + refreshToken', async () => {
    const activeSession = buildActiveSession();
    const account = buildAccount();
    sessionRepo.findByTokenHash.mockResolvedValue(activeSession);
    accountRepo.findByUserId.mockResolvedValue(account);

    const command = new RefreshTokenCommand({
      refreshToken: 'some-plain-token',
    });

    const result = await handler.execute(command);

    expect(sessionRepo.save).toHaveBeenCalledTimes(2);
    expect(tokenService.sign).toHaveBeenCalledWith(
      activeSession.userId.value,
      account.email.value,
    );
    expect(result).toHaveProperty('accessToken', 'new-access-token');
    expect(result).toHaveProperty('refreshToken');
    expect(typeof result.refreshToken).toBe('string');
  });
});
