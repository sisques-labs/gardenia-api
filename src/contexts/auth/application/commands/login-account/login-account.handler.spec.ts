import { EventBus } from '@nestjs/cqrs';

import { ValidateAccountCredentialsService } from '@contexts/auth/application/services/read/validate-account-credentials/validate-account-credentials.service';
import { TokenService } from '@contexts/auth/application/services/token.service';
import { GenerateRefreshTokenService } from '@contexts/auth/application/services/write/generate-refresh-token/generate-refresh-token.service';
import { HashRefreshTokenService } from '@contexts/auth/application/services/write/hash-refresh-token/hash-refresh-token.service';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';
import { IAuthSessionWriteRepository } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';

import { LoginAccountCommand } from './login-account.command';
import { LoginAccountCommandHandler } from './login-account.handler';

describe('LoginAccountCommandHandler', () => {
  let handler: LoginAccountCommandHandler;
  let tokenService: jest.Mocked<TokenService>;
  let eventBus: jest.Mocked<EventBus>;
  let validateAccountCredentialsService: jest.Mocked<ValidateAccountCredentialsService>;
  let sessionRepo: jest.Mocked<IAuthSessionWriteRepository>;
  let generateRefreshTokenService: jest.Mocked<GenerateRefreshTokenService>;
  let hashRefreshTokenService: jest.Mocked<HashRefreshTokenService>;

  const buildAccount = () =>
    new AccountBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withUserId('660e8400-e29b-41d4-a716-446655440001')
      .withEmail('test@example.com')
      .withPasswordHash('hashed-password')
      .withCreatedAt(new Date('2024-01-01'))
      .withUpdatedAt(new Date('2024-01-01'))
      .build();

  beforeEach(() => {
    tokenService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    } as unknown as jest.Mocked<TokenService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    validateAccountCredentialsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ValidateAccountCredentialsService>;

    sessionRepo = {
      save: jest.fn(),
      findByTokenHash: jest.fn(),
      findById: jest.fn(),
      revokeAllByUserId: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IAuthSessionWriteRepository>;

    generateRefreshTokenService = {
      execute: jest.fn().mockResolvedValue('refresh-token'),
    } as unknown as jest.Mocked<GenerateRefreshTokenService>;

    hashRefreshTokenService = {
      execute: jest.fn().mockResolvedValue('a'.repeat(64)),
    } as unknown as jest.Mocked<HashRefreshTokenService>;

    handler = new LoginAccountCommandHandler(
      eventBus,
      tokenService,
      validateAccountCredentialsService,
      new AuthSessionBuilder(),
      generateRefreshTokenService,
      hashRefreshTokenService,
      sessionRepo,
    );
  });

  it('throws when the credentials are invalid', async () => {
    validateAccountCredentialsService.execute.mockResolvedValue(null);

    const command = new LoginAccountCommand({
      email: 'test@example.com',
      password: 'wrong-password',
    });

    await expect(handler.execute(command)).rejects.toThrow(
      new InvalidCredentialsException(),
    );
    expect(tokenService.sign).not.toHaveBeenCalled();
  });

  it('returns the access token when the credentials are valid', async () => {
    const account = buildAccount();
    validateAccountCredentialsService.execute.mockResolvedValue(account);

    const command = new LoginAccountCommand({
      email: 'test@example.com',
      password: 'plain-password',
    });

    const result = await handler.execute(command);

    expect(result).toHaveProperty('accessToken', 'jwt-token');
    expect(tokenService.sign).toHaveBeenCalledWith(
      account.userId.value,
      account.email.value,
    );
  });

  it('creates and saves an AuthSession and returns refreshToken on successful login', async () => {
    const account = buildAccount();
    validateAccountCredentialsService.execute.mockResolvedValue(account);

    const command = new LoginAccountCommand({
      email: 'test@example.com',
      password: 'plain-password',
    });

    const result = await handler.execute(command);

    expect(sessionRepo.save).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('refreshToken');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken.length).toBeGreaterThan(0);
  });

  it('publishes AuthSessionCreatedEvent after successful login', async () => {
    const account = buildAccount();
    validateAccountCredentialsService.execute.mockResolvedValue(account);

    const command = new LoginAccountCommand({
      email: 'test@example.com',
      password: 'plain-password',
    });

    await handler.execute(command);

    expect(eventBus.publishAll).toHaveBeenCalled();
  });
});
