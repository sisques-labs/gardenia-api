import { IUserReadRepository } from '@contexts/users/domain/repositories/read/user-read.repository';
import { UsernameAlreadyTakenException } from '@contexts/users/domain/exceptions/username-already-taken.exception';
import { UsernameValueObject } from '@contexts/users/domain/value-objects/username/username.value-object';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { AssertUsernameAvailableService } from './assert-username-available.service';

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

describe('AssertUsernameAvailableService', () => {
  let service: AssertUsernameAvailableService;
  let readRepository: jest.Mocked<IUserReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IUserReadRepository>;

    service = new AssertUsernameAvailableService(readRepository);
  });

  describe('username is available', () => {
    it('should resolve without error when username is not taken', async () => {
      readRepository.findByUsername.mockResolvedValue(null);
      const username = new UsernameValueObject('available_user');

      await expect(service.execute(username)).resolves.toBeUndefined();
      expect(readRepository.findByUsername).toHaveBeenCalledWith('available_user');
    });
  });

  describe('username is taken', () => {
    it('should throw UsernameAlreadyTakenException when username exists in read repository', async () => {
      const viewModel = buildViewModel();
      readRepository.findByUsername.mockResolvedValue(viewModel);
      const username = new UsernameValueObject('johndoe');

      await expect(service.execute(username)).rejects.toThrow(UsernameAlreadyTakenException);
    });

    it('should include the username in the thrown exception message', async () => {
      const viewModel = buildViewModel();
      readRepository.findByUsername.mockResolvedValue(viewModel);
      const username = new UsernameValueObject('johndoe');

      await expect(service.execute(username)).rejects.toThrow('johndoe');
    });
  });
});
