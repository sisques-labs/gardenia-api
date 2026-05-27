import { IAccountReadRepository } from '@contexts/auth/domain/repositories/read/account-read.repository';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { AccountFindByCriteriaQuery } from './account-find-by-criteria.query';
import { AccountFindByCriteriaQueryHandler } from './account-find-by-criteria.handler';

describe('AccountFindByCriteriaQueryHandler', () => {
  let handler: AccountFindByCriteriaQueryHandler;
  let readRepository: jest.Mocked<IAccountReadRepository>;

  beforeEach(() => {
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IAccountReadRepository>;

    handler = new AccountFindByCriteriaQueryHandler(readRepository);
  });

  it('should delegate to read repository and return PaginatedResult<AccountViewModel>', async () => {
    const viewModel = new AccountViewModel({
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '660e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
    const paginatedResult = new PaginatedResult<AccountViewModel>(
      [viewModel],
      1,
      1,
      10,
    );
    const criteria = {} as Criteria;
    const query = new AccountFindByCriteriaQuery({ criteria });
    readRepository.findByCriteria.mockResolvedValue(paginatedResult);

    const result = await handler.execute(query);

    expect(readRepository.findByCriteria).toHaveBeenCalledWith(criteria);
    expect(result).toBe(paginatedResult);
  });
});
