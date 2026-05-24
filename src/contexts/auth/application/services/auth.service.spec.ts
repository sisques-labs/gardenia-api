import { AuthService } from './auth.service';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let accountWriteRepository: jest.Mocked<IAccountWriteRepository>;

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

    accountWriteRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<IAccountWriteRepository>;

    service = new AuthService(accountWriteRepository);
  });

  describe('validateAccount', () => {
    it('should call bcrypt.compare with account.passwordHash.value (a plain string)', async () => {
      const account = buildAccount();
      accountWriteRepository.findByEmail.mockResolvedValue(account);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.validateAccount('test@example.com', 'plain-password');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plain-password',
        account.passwordHash.value,
      );
    });

    it('should return { userId, email } as primitives when credentials are valid', async () => {
      const account = buildAccount();
      accountWriteRepository.findByEmail.mockResolvedValue(account);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

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
      const account = buildAccount();
      accountWriteRepository.findByEmail.mockResolvedValue(account);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateAccount(
        'test@example.com',
        'wrong-password',
      );

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong-password',
        account.passwordHash.value,
      );
    });

    it('should return null when email is unknown — without accessing any VO', async () => {
      accountWriteRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validateAccount(
        'unknown@example.com',
        'any-password',
      );

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });
});
