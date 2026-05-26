import { Criteria, PaginatedResult, UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import { IUserReadRepository } from '@contexts/users/domain/repositories/read/user-read.repository';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { UserFindByCriteriaQuery } from './user-find-by-criteria.query';
import { UserFindByCriteriaQueryHandler } from './user-find-by-criteria.handler';

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

describe('UserFindByCriteriaQueryHandler', () => {
  let handler: UserFindByCriteriaQueryHandler;
  let userReadRepository: jest.Mocked<IUserReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    userReadRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IUserReadRepository>;

    handler = new UserFindByCriteriaQueryHandler(userReadRepository);
  });

  describe('found', () => {
    it('should delegate to read repository and return PaginatedResult<UserViewModel>', async () => {
      const viewModel = buildViewModel();
      const paginatedResult = new PaginatedResult<UserViewModel>([viewModel], 1, 1, 10);
      const criteria = {} as Criteria;
      const query = new UserFindByCriteriaQuery({ criteria });
      userReadRepository.findByCriteria.mockResolvedValue(paginatedResult);

      const result = await handler.execute(query);

      expect(userReadRepository.findByCriteria).toHaveBeenCalledWith(criteria);
      expect(result).toBe(paginatedResult);
    });
  });

  describe('not found', () => {
    it('should return an empty PaginatedResult when no users match criteria', async () => {
      const emptyResult = new PaginatedResult<UserViewModel>([], 0, 1, 10);
      const criteria = {} as Criteria;
      const query = new UserFindByCriteriaQuery({ criteria });
      userReadRepository.findByCriteria.mockResolvedValue(emptyResult);

      const result = await handler.execute(query);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('repository error', () => {
    it('should propagate repository errors', async () => {
      const criteria = {} as Criteria;
      const query = new UserFindByCriteriaQuery({ criteria });
      userReadRepository.findByCriteria.mockRejectedValue(new Error('DB error'));

      await expect(handler.execute(query)).rejects.toThrow('DB error');
    });
  });
});
