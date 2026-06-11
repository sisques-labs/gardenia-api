import { QueryBus } from '@nestjs/cqrs';
import { FilterOperator } from '@sisques-labs/nestjs-kit';

import { AccountFindByCriteriaQuery } from '@contexts/auth/application/queries/account-find-by-criteria/account-find-by-criteria.query';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { AccountGraphQLMapper } from '@contexts/auth/transport/graphql/mappers/account/account.mapper';
import { AccountObject } from '@contexts/auth/transport/graphql/objects/account.object';

import { AuthQueriesResolver } from './auth-queries.resolver';

const buildMockAccountViewModel = (): AccountViewModel =>
  new AccountViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '660e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('AuthQueriesResolver', () => {
  let sut: AuthQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let accountGraphQLMapper: jest.Mocked<AccountGraphQLMapper>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    accountGraphQLMapper = {
      toViewModel: jest.fn(),
    } as unknown as jest.Mocked<AccountGraphQLMapper>;
    sut = new AuthQueriesResolver(queryBus, accountGraphQLMapper);
  });

  describe('me()', () => {
    const currentUser: CurrentUserPayload = {
      userId: '660e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
      appRole: AppRoleEnum.USER,
    };

    it('should return AccountObject with all 5 fields when account is found', async () => {
      const viewModel = buildMockAccountViewModel();
      const accountObject = Object.assign(new AccountObject(), {
        id: viewModel.id,
        userId: viewModel.userId,
        email: viewModel.email,
        createdAt: viewModel.createdAt,
        updatedAt: viewModel.updatedAt,
      });
      queryBus.execute.mockResolvedValue({
        items: [viewModel],
        total: 1,
        page: 1,
        limit: 10,
      });
      accountGraphQLMapper.toViewModel.mockReturnValue(accountObject);

      const result = await sut.me(currentUser);

      expect(result).toBe(accountObject);
      expect(accountGraphQLMapper.toViewModel).toHaveBeenCalledWith(viewModel);
      expect(result).toHaveProperty('id', viewModel.id);
      expect(result).toHaveProperty('userId', viewModel.userId);
      expect(result).toHaveProperty('email', viewModel.email);
      expect(result).toHaveProperty('createdAt', viewModel.createdAt);
      expect(result).toHaveProperty('updatedAt', viewModel.updatedAt);
      const dispatched = queryBus.execute.mock
        .calls[0][0] as AccountFindByCriteriaQuery;
      expect(dispatched).toBeInstanceOf(AccountFindByCriteriaQuery);
      expect(dispatched.criteria.filters).toEqual([
        {
          field: 'userId',
          operator: FilterOperator.EQUALS,
          value: currentUser.userId,
        },
      ]);
    });

    it('should throw AccountNotFoundException when account is not found', async () => {
      queryBus.execute.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      await expect(sut.me(currentUser)).rejects.toBeInstanceOf(
        AccountNotFoundException,
      );
    });
  });
});
