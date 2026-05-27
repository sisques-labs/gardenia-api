import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { IAccountReadRepository } from '@contexts/auth/domain/repositories/read/account-read.repository';
import { AccountIdValueObject } from '@contexts/auth/domain/value-objects/account-id/account-id.vo';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AssertAccountViewModelExistsService } from './assert-account-view-model-exists.service';

const buildViewModel = (): AccountViewModel =>
  new AccountViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '660e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('AssertAccountViewModelExistsService', () => {
  let service: AssertAccountViewModelExistsService;
  let readRepository: jest.Mocked<IAccountReadRepository>;

  beforeEach(() => {
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IAccountReadRepository>;

    service = new AssertAccountViewModelExistsService(readRepository);
  });

  it('should return the view model when read repository finds the account', async () => {
    const viewModel = buildViewModel();
    const id = new AccountIdValueObject('550e8400-e29b-41d4-a716-446655440000');
    readRepository.findById.mockResolvedValue(viewModel);

    const result = await service.execute(id);

    expect(result).toBe(viewModel);
    expect(readRepository.findById).toHaveBeenCalledWith(id.value);
  });

  it('should throw AccountNotFoundException when read repository returns null', async () => {
    const id = new AccountIdValueObject('550e8400-e29b-41d4-a716-446655440000');
    readRepository.findById.mockResolvedValue(null);

    await expect(service.execute(id)).rejects.toThrow(AccountNotFoundException);
  });
});
