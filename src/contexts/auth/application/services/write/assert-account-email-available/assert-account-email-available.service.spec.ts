import { AccountAlreadyExistsException } from '@contexts/auth/domain/exceptions/account-already-exists.exception';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { AssertAccountEmailAvailableService } from './assert-account-email-available.service';

describe('AssertAccountEmailAvailableService', () => {
  let service: AssertAccountEmailAvailableService;
  let writeRepository: jest.Mocked<IAccountWriteRepository>;

  beforeEach(() => {
    writeRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IAccountWriteRepository>;

    service = new AssertAccountEmailAvailableService(writeRepository);
  });

  it('should resolve without throwing when email is not taken', async () => {
    writeRepository.findByEmail.mockResolvedValue(null);
    const email = new AccountEmailValueObject('new@example.com');

    await expect(service.execute(email)).resolves.toBeUndefined();
    expect(writeRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
  });

  it('should throw AccountAlreadyExistsException when email is already registered', async () => {
    const existing = new AccountBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withUserId('660e8400-e29b-41d4-a716-446655440001')
      .withEmail('taken@example.com')
      .withPasswordHash('hashed-password')
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();

    writeRepository.findByEmail.mockResolvedValue(existing);
    const email = new AccountEmailValueObject('taken@example.com');

    await expect(service.execute(email)).rejects.toThrow(AccountAlreadyExistsException);
  });
});
