import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { FilterOperator } from '@sisques-labs/nestjs-kit';

import { AccountFindByCriteriaQuery } from '@contexts/auth/application/queries/account-find-by-criteria/account-find-by-criteria.query';
import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';

import { AuthController } from './auth.controller';

const buildMockResponse = () =>
  ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  }) as unknown as jest.Mocked<Response>;

const buildMockAccountViewModel = (): AccountViewModel =>
  new AccountViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '660e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('AuthController', () => {
  let sut: AuthController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    sut = new AuthController(commandBus, queryBus);
  });

  describe('register()', () => {
    it('should execute RegisterAccountCommand with correct input', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.register({
        email: 'test@example.com',
        password: 'SuperStr0ng!Pass',
      });

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RegisterAccountCommand),
      );
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
      const res = buildMockResponse();

      await sut.login(
        { email: 'test@example.com', password: 'SuperStr0ng!Pass' },
        res,
      );

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(LoginAccountCommand),
      );
    });

    it('should return payload containing accessToken and set refresh cookie', async () => {
      commandBus.execute.mockResolvedValue({
        accessToken: 'jwt-token',
        refreshToken: 'plain-refresh',
      });
      const res = buildMockResponse();

      const result = await sut.login(
        { email: 'test@example.com', password: 'SuperStr0ng!Pass' },
        res,
      );

      expect(result).toHaveProperty('accessToken', 'jwt-token');
      expect(res.cookie).toHaveBeenCalledWith(
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

    it('should return the AccountViewModel when account is found', async () => {
      const viewModel = buildMockAccountViewModel();
      queryBus.execute.mockResolvedValue({
        items: [viewModel],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await sut.me(currentUser);

      expect(result).toBe(viewModel);
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
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

      await sut.me(currentUser);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('deleteAccount()', () => {
    const currentUser: CurrentUserPayload = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
    };

    it('should dispatch DeleteAccountCommand with userId from CurrentUser', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.deleteAccount(currentUser);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteAccountCommand),
      );
    });

    it('should return undefined (void / 204 semantics)', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await sut.deleteAccount(currentUser);

      expect(result).toBeUndefined();
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
