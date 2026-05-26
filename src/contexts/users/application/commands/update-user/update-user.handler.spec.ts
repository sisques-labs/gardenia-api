import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { EventBus } from '@nestjs/cqrs';

import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import { IUserWriteRepository } from '@contexts/users/domain/repositories/write/user-write.repository';
import { AssertUserExistsService } from '@contexts/users/application/services/write/assert-user-exists/assert-user-exists.service';
import { UpdateUserCommand } from './update-user.command';
import { UpdateUserCommandHandler } from './update-user.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildUser = (): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('UpdateUserCommandHandler', () => {
  let handler: UpdateUserCommandHandler;
  let userWriteRepository: jest.Mocked<IUserWriteRepository>;
  let assertUserExistsService: jest.Mocked<AssertUserExistsService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    userWriteRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IUserWriteRepository>;

    assertUserExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertUserExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new UpdateUserCommandHandler(userWriteRepository, assertUserExistsService, eventBus);
  });

  describe('happy path', () => {
    it('should update the user, save, and publish events', async () => {
      const user = buildUser();
      assertUserExistsService.execute.mockResolvedValue(user);
      userWriteRepository.save.mockResolvedValue(undefined as any);

      const command = new UpdateUserCommand({ id: USER_ID });

      await handler.execute(command);

      expect(assertUserExistsService.execute).toHaveBeenCalledTimes(1);
      expect(userWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('user not found', () => {
    it('should throw UserNotFoundException when user does not exist', async () => {
      assertUserExistsService.execute.mockRejectedValue(
        new UserNotFoundException(USER_ID),
      );

      const command = new UpdateUserCommand({ id: USER_ID });

      await expect(handler.execute(command)).rejects.toThrow(UserNotFoundException);
      expect(userWriteRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('repository failure', () => {
    it('should propagate error when save throws', async () => {
      const user = buildUser();
      assertUserExistsService.execute.mockResolvedValue(user);
      userWriteRepository.save.mockRejectedValue(new Error('DB write error'));

      const command = new UpdateUserCommand({ id: USER_ID });

      await expect(handler.execute(command)).rejects.toThrow('DB write error');
    });
  });
});
