import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  FilterOperator,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { AccountFindByCriteriaQuery } from '@contexts/auth/application/queries/account-find-by-criteria/account-find-by-criteria.query';
import { AccountGraphQLMapper } from '@contexts/auth/transport/graphql/mappers/account/account.mapper';
import { AccountObject } from '@contexts/auth/transport/graphql/objects/account.object';
import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';

import { AuthResolver } from './auth.resolver';

const buildMockContext = () => ({
  req: {
    cookies: {} as Record<string, string>,
    res: {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    },
  },
});

const buildMockAccountViewModel = (): AccountViewModel =>
  new AccountViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '660e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('AuthResolver', () => {
  let sut: AuthResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mutationResponseGraphQLMapper: jest.Mocked<MutationResponseGraphQLMapper>;
  let accountGraphQLMapper: jest.Mocked<AccountGraphQLMapper>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mutationResponseGraphQLMapper = {
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;
    accountGraphQLMapper = {
      toAccountObject: jest.fn(),
    } as unknown as jest.Mocked<AccountGraphQLMapper>;
    sut = new AuthResolver(
      commandBus,
      queryBus,
      mutationResponseGraphQLMapper,
      accountGraphQLMapper,
    );
  });

  describe('register()', () => {
    it('should execute RegisterAccountCommand with correct input', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await sut.register({
        email: 'test@example.com',
        password: 'SuperStr0ng!Pass',
      });

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RegisterAccountCommand),
      );
      expect(result).toBe(true);
    });

    it('should dispatch exactly one RegisterAccountCommand per call', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.register({
        email: 'user@test.com',
        password: 'AnotherStr0ng!Pass',
      });
      await sut.register({ email: 'other@test.com', password: 'other123' });

      expect(commandBus.execute).toHaveBeenCalledTimes(2);
      expect(commandBus.execute.mock.calls[0][0]).toBeInstanceOf(
        RegisterAccountCommand,
      );
      expect(commandBus.execute.mock.calls[1][0]).toBeInstanceOf(
        RegisterAccountCommand,
      );
    });
  });

  describe('login()', () => {
    it('should execute LoginAccountCommand with correct input', async () => {
      commandBus.execute.mockResolvedValue({
        accessToken: 'jwt-token',
        refreshToken: 'plain-refresh',
      });
      const ctx = buildMockContext();

      await sut.login(
        { email: 'test@example.com', password: 'SuperStr0ng!Pass' },
        ctx,
      );

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(LoginAccountCommand),
      );
    });

    it('should return AuthPayloadObject with accessToken and set refresh cookie', async () => {
      commandBus.execute.mockResolvedValue({
        accessToken: 'jwt-token',
        refreshToken: 'plain-refresh',
      });
      const ctx = buildMockContext();

      const result = await sut.login(
        { email: 'test@example.com', password: 'SuperStr0ng!Pass' },
        ctx,
      );

      expect(result.accessToken).toBe('jwt-token');
      expect(ctx.req.res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'plain-refresh',
        expect.any(Object),
      );
    });
  });

  describe('me()', () => {
    const currentUser: CurrentUserPayload = {
      userId: '660e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
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
      accountGraphQLMapper.toAccountObject.mockReturnValue(accountObject);

      const result = await sut.me(currentUser);

      expect(result).toBe(accountObject);
      expect(accountGraphQLMapper.toAccountObject).toHaveBeenCalledWith(
        viewModel,
      );
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

    it('should not call commandBus inside me()', async () => {
      const viewModel = buildMockAccountViewModel();
      queryBus.execute.mockResolvedValue({
        items: [viewModel],
        total: 1,
        page: 1,
        limit: 10,
      });
      accountGraphQLMapper.toAccountObject.mockReturnValue({} as AccountObject);

      await sut.me(currentUser);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('deleteAccount()', () => {
    const currentUser: CurrentUserPayload = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
    };

    it('should dispatch DeleteAccountCommand with correct userId', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.deleteAccount(currentUser);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteAccountCommand),
      );
    });

    it('should return true', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await sut.deleteAccount(currentUser);

      expect(result).toBe(true);
    });

    it('should dispatch exactly one DeleteAccountCommand per call', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.deleteAccount(currentUser);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const dispatched = commandBus.execute.mock
        .calls[0][0] as DeleteAccountCommand;
      expect(dispatched.userId).toBe(currentUser.userId);
    });
  });
});
