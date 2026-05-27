import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { AccountIdValueObject } from '@contexts/auth/domain/value-objects/account-id/account-id.vo';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AssertAccountViewModelExistsService } from '@contexts/auth/application/services/read/assert-account-view-model-exists/assert-account-view-model-exists.service';
import { AccountFindByIdQuery } from './account-find-by-id.query';
import { AccountFindByIdQueryHandler } from './account-find-by-id.handler';

const buildViewModel = (): AccountViewModel =>
  new AccountViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '660e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('AccountFindByIdQueryHandler', () => {
  let handler: AccountFindByIdQueryHandler;
  let assertService: jest.Mocked<AssertAccountViewModelExistsService>;

  beforeEach(() => {
    assertService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertAccountViewModelExistsService>;

    handler = new AccountFindByIdQueryHandler(assertService);
  });

  it('should delegate to AssertAccountViewModelExistsService and return the view model', async () => {
    const viewModel = buildViewModel();
    const query = new AccountFindByIdQuery({ id: '550e8400-e29b-41d4-a716-446655440000' });
    assertService.execute.mockResolvedValue(viewModel);

    const result = await handler.execute(query);

    expect(assertService.execute).toHaveBeenCalledWith(expect.any(AccountIdValueObject));
    expect(result).toBe(viewModel);
  });

  it('should propagate exceptions thrown by AssertAccountViewModelExistsService', async () => {
    const query = new AccountFindByIdQuery({ id: '550e8400-e29b-41d4-a716-446655440000' });
    assertService.execute.mockRejectedValue(
      new AccountNotFoundException('550e8400-e29b-41d4-a716-446655440000'),
    );

    await expect(handler.execute(query)).rejects.toThrow(AccountNotFoundException);
  });
});
