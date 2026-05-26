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
  });

  describe('not found', () => {
    it('should propagate UserNotFoundException from the service', async () => {
      const query = new UserFindByIdQuery({ id: USER_ID });
      assertUserViewModelExistsService.execute.mockRejectedValue(
        new UserNotFoundException(USER_ID),
      );

      await expect(handler.execute(query)).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('repository error', () => {
    it('should propagate generic repository errors', async () => {
      const query = new UserFindByIdQuery({ id: USER_ID });
      assertUserViewModelExistsService.execute.mockRejectedValue(new Error('DB error'));

      await expect(handler.execute(query)).rejects.toThrow('DB error');
    });
  });
});
