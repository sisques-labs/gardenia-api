import { AuthService } from './auth.service';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { ValidateAccountCredentialsService } from './read/validate-account-credentials/validate-account-credentials.service';

describe('AuthService', () => {
  let service: AuthService;
  let validateAccountCredentialsService: jest.Mocked<ValidateAccountCredentialsService>;

  const buildAccount = (): AccountAggregate =>
    new AccountBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withUserId('660e8400-e29b-41d4-a716-446655440001')
      .withEmail('test@example.com')
      .withPasswordHash('hashed-password')
      .withCreatedAt(new Date('2024-01-01'))
      .withUpdatedAt(new Date('2024-01-01'))
      .build();

  beforeEach(() => {
    jest.clearAllMocks();

    validateAccountCredentialsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ValidateAccountCredentialsService>;

    service = new AuthService(validateAccountCredentialsService);
  });

  describe('validateAccount', () => {
    it('should delegate the credential validation to the application service', async () => {
      const account = buildAccount();
      validateAccountCredentialsService.execute.mockResolvedValue(account);

      await service.validateAccount('test@example.com', 'plain-password');

      expect(validateAccountCredentialsService.execute).toHaveBeenCalledWith(
        'test@example.com',
        'plain-password',
      );
    });

    it('should return { userId, email } as primitives when credentials are valid', async () => {
      const account = buildAccount();
      validateAccountCredentialsService.execute.mockResolvedValue(account);

      const result = await service.validateAccount(
        'test@example.com',
        'plain-password',
      );

      expect(result).toEqual({
        userId: account.userId.value,
        email: account.email.value,
      });
    });

    it('should return null when password is wrong', async () => {
      validateAccountCredentialsService.execute.mockResolvedValue(null);

      const result = await service.validateAccount(
        'test@example.com',
        'wrong-password',
      );

      expect(result).toBeNull();
      expect(validateAccountCredentialsService.execute).toHaveBeenCalledWith(
        'test@example.com',
        'wrong-password',
      );
    });

    it('should return null when email is unknown — without accessing any VO', async () => {
      validateAccountCredentialsService.execute.mockResolvedValue(null);

      const result = await service.validateAccount(
        'unknown@example.com',
        'any-password',
      );

      expect(result).toBeNull();
      expect(validateAccountCredentialsService.execute).toHaveBeenCalledWith(
        'unknown@example.com',
        'any-password',
      );
    });
  });
});
