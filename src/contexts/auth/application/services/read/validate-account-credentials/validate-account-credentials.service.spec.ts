import * as bcrypt from 'bcrypt';

import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';

import { ValidateAccountCredentialsService } from './validate-account-credentials.service';

jest.mock('bcrypt');

describe('ValidateAccountCredentialsService', () => {
  let service: ValidateAccountCredentialsService;
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

    service = new ValidateAccountCredentialsService(accountWriteRepository);
  });

  it('returns the account when the credentials are valid', async () => {
    const account = buildAccount();
    accountWriteRepository.findByEmail.mockResolvedValue(account);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.execute('test@example.com', 'plain-password');

    expect(result).toBe(account);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'plain-password',
      account.passwordHash.value,
    );
  });

  it('returns null when the email is unknown', async () => {
    accountWriteRepository.findByEmail.mockResolvedValue(null);

    const result = await service.execute('unknown@example.com', 'any-password');

    expect(result).toBeNull();
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('returns null when the password is invalid', async () => {
    const account = buildAccount();
    accountWriteRepository.findByEmail.mockResolvedValue(account);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await service.execute('test@example.com', 'wrong-password');

    expect(result).toBeNull();
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'wrong-password',
      account.passwordHash.value,
    );
  });
});
