import { EventBus } from '@nestjs/cqrs';

import { ValidateAccountCredentialsService } from '@contexts/auth/application/services/read/validate-account-credentials/validate-account-credentials.service';
import { TokenService } from '@contexts/auth/application/services/token.service';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';

import { LoginAccountCommand } from './login-account.command';
import { LoginAccountCommandHandler } from './login-account.handler';

describe('LoginAccountCommandHandler', () => {
  let handler: LoginAccountCommandHandler;
  let tokenService: jest.Mocked<TokenService>;
  let eventBus: jest.Mocked<EventBus>;
  let validateAccountCredentialsService: jest.Mocked<ValidateAccountCredentialsService>;

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
    } as unknown as jest.Mocked<EventBus>;

    validateAccountCredentialsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ValidateAccountCredentialsService>;

    handler = new LoginAccountCommandHandler(
      eventBus,
      tokenService,
      validateAccountCredentialsService,
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

    await expect(handler.execute(command)).resolves.toEqual({
      accessToken: 'jwt-token',
    });
    expect(tokenService.sign).toHaveBeenCalledWith(
      account.userId.value,
      account.email.value,
    );
  });
});
