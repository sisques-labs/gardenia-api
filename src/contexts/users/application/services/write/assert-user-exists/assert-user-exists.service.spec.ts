import { UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import { IUserWriteRepository } from '@contexts/users/domain/repositories/write/user-write.repository';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';
import { AssertUserExistsService } from './assert-user-exists.service';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildAggregate = (): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
    .withUsername('johndoe')
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('AssertUserExistsService', () => {
  let service: AssertUserExistsService;
  let writeRepository: jest.Mocked<IUserWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IUserWriteRepository>;

    service = new AssertUserExistsService(writeRepository);
  });

  describe('user exists', () => {
    it('should return the aggregate when write repository finds the user', async () => {
      const aggregate = buildAggregate();
      const id = new UserIdValueObject(USER_ID);
      writeRepository.findById.mockResolvedValue(aggregate);

      const result = await service.execute(id);

      expect(result).toBe(aggregate);
      expect(writeRepository.findById).toHaveBeenCalledWith(id.value);
    });
  });

  describe('user does not exist', () => {
    it('should throw UserNotFoundException when write repository returns null', async () => {
      const id = new UserIdValueObject(USER_ID);
      writeRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(UserNotFoundException);
    });

    it('should include the user id in the thrown exception', async () => {
      const id = new UserIdValueObject(USER_ID);
      writeRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(USER_ID);
    });
  });
});
