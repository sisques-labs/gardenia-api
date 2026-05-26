import { UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import { IUserReadRepository } from '@contexts/users/domain/repositories/read/user-read.repository';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { AssertUserViewModelExistsService } from './assert-user-view-model-exists.service';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildViewModel = (): UserViewModel =>
  new UserViewModel({
    id: USER_ID,
    status: UserStatusEnum.ACTIVE,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('AssertUserViewModelExistsService', () => {
  let service: AssertUserViewModelExistsService;
  let readRepository: jest.Mocked<IUserReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IUserReadRepository>;

    service = new AssertUserViewModelExistsService(readRepository);
  });

  describe('user exists', () => {
    it('should return the view model when read repository finds the user', async () => {
      const viewModel = buildViewModel();
      const id = new UserIdValueObject(USER_ID);
      readRepository.findById.mockResolvedValue(viewModel);

      const result = await service.execute(id);

      expect(result).toBe(viewModel);
      expect(readRepository.findById).toHaveBeenCalledWith(id.value);
    });
  });

  describe('user does not exist', () => {
    it('should throw UserNotFoundException when read repository returns null', async () => {
      const id = new UserIdValueObject(USER_ID);
      readRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(UserNotFoundException);
    });

    it('should include the user id in the thrown exception', async () => {
      const id = new UserIdValueObject(USER_ID);
      readRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(USER_ID);
    });
  });
});
