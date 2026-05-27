import { UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { AssertUserViewModelExistsService } from '@contexts/users/application/services/read/assert-user-view-model-exists/assert-user-view-model-exists.service';
import { UserFindByIdQuery } from './user-find-by-id.query';
import { UserFindByIdQueryHandler } from './user-find-by-id.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildViewModel = (): UserViewModel =>
  new UserViewModel({
    id: USER_ID,
    status: UserStatusEnum.ACTIVE,
    username: 'johndoe',
    firstName: null,
    lastName: null,
    avatarUrl: null,
    bio: null,
    locale: null,
    timezone: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

const buildFullViewModel = (): UserViewModel =>
  new UserViewModel({
    id: USER_ID,
    status: UserStatusEnum.ACTIVE,
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: 'https://example.com/avatar.png',
    bio: 'A short bio.',
    locale: 'es-AR',
    timezone: 'America/Buenos_Aires',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('UserFindByIdQueryHandler', () => {
  let handler: UserFindByIdQueryHandler;
  let assertUserViewModelExistsService: jest.Mocked<AssertUserViewModelExistsService>;

  beforeEach(() => {
    jest.clearAllMocks();

    assertUserViewModelExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertUserViewModelExistsService>;

    handler = new UserFindByIdQueryHandler(assertUserViewModelExistsService);
  });

  describe('found', () => {
    it('should delegate to AssertUserViewModelExistsService and return the view model', async () => {
      const viewModel = buildViewModel();
      const query = new UserFindByIdQuery({ id: USER_ID });
      assertUserViewModelExistsService.execute.mockResolvedValue(viewModel);

      const result = await handler.execute(query);

      expect(assertUserViewModelExistsService.execute).toHaveBeenCalledWith(
        expect.any(UserIdValueObject),
      );
      expect(result).toBe(viewModel);
    });

    it('should return a view model that includes all profile fields when user has them', async () => {
      const viewModel = buildFullViewModel();
      const query = new UserFindByIdQuery({ id: USER_ID });
      assertUserViewModelExistsService.execute.mockResolvedValue(viewModel);

      const result = await handler.execute(query);

      expect(result.username).toBe('johndoe');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.avatarUrl).toBe('https://example.com/avatar.png');
      expect(result.bio).toBe('A short bio.');
      expect(result.locale).toBe('es-AR');
      expect(result.timezone).toBe('America/Buenos_Aires');
    });
  });

  describe('not found', () => {
    it('should propagate UserNotFoundException from the service', async () => {
      const query = new UserFindByIdQuery({ id: USER_ID });
      assertUserViewModelExistsService.execute.mockRejectedValue(
        new UserNotFoundException(USER_ID),
      );

      await expect(handler.execute(query)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('repository error', () => {
    it('should propagate generic repository errors', async () => {
      const query = new UserFindByIdQuery({ id: USER_ID });
      assertUserViewModelExistsService.execute.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(handler.execute(query)).rejects.toThrow('DB error');
    });
  });
});
