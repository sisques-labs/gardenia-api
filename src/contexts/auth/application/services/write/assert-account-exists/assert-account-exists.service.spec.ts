import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { AccountIdValueObject } from '@contexts/auth/domain/value-objects/account-id/account-id.vo';
import { AssertAccountExistsService } from './assert-account-exists.service';

const buildAggregate = (): AccountAggregate =>
  new AccountBuilder()
    .withId('550e8400-e29b-41d4-a716-446655440000')
    .withUserId('660e8400-e29b-41d4-a716-446655440001')
    .withEmail('test@example.com')
    .withPasswordHash('hashed-password')
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('AssertAccountExistsService', () => {
  let service: AssertAccountExistsService;
  let writeRepository: jest.Mocked<IAccountWriteRepository>;

  beforeEach(() => {
    writeRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IAccountWriteRepository>;

    service = new AssertAccountExistsService(writeRepository);
  });

  it('should return the aggregate when write repository finds the account', async () => {
    const aggregate = buildAggregate();
    const id = new AccountIdValueObject('550e8400-e29b-41d4-a716-446655440000');
    writeRepository.findById.mockResolvedValue(aggregate);

    const result = await service.execute(id);

    expect(result).toBe(aggregate);
    expect(writeRepository.findById).toHaveBeenCalledWith(id.value);
  });

  it('should throw AccountNotFoundException when write repository returns null', async () => {
    const id = new AccountIdValueObject('550e8400-e29b-41d4-a716-446655440000');
    writeRepository.findById.mockResolvedValue(null);

    await expect(service.execute(id)).rejects.toThrow(AccountNotFoundException);
  });
});
