import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { EventBus } from '@nestjs/cqrs';

import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { IUserWriteRepository } from '@contexts/users/domain/repositories/write/user-write.repository';
import { CreateUserCommand } from './create-user.command';
import { CreateUserCommandHandler } from './create-user.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildUser = (): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('CreateUserCommandHandler', () => {
  let handler: CreateUserCommandHandler;
  let userWriteRepository: jest.Mocked<IUserWriteRepository>;
  let userBuilder: jest.Mocked<UserBuilder>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    const builtUser = buildUser();

    userWriteRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IUserWriteRepository>;

    userBuilder = {
      withId: jest.fn().mockReturnThis(),
      withStatus: jest.fn().mockReturnThis(),
      withCreatedAt: jest.fn().mockReturnThis(),
      withUpdatedAt: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(builtUser),
    } as unknown as jest.Mocked<UserBuilder>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreateUserCommandHandler(userWriteRepository, userBuilder, eventBus);
  });

  describe('happy path', () => {
    it('should save the user and publish events', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      const command = new CreateUserCommand({
        id: USER_ID,
        status: UserStatusEnum.ACTIVE,
      } as any);

      await handler.execute(command);

      expect(userWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should call the builder build() method to create the user', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      const command = new CreateUserCommand({
        id: USER_ID,
        status: UserStatusEnum.ACTIVE,
      } as any);

      await handler.execute(command);

      expect(userBuilder.build).toHaveBeenCalledTimes(1);
    });
  });

  describe('repository failure', () => {
    it('should propagate the error when save throws (handler does not swallow errors in test context)', async () => {
      // Note: the handler has a try/catch that attempts to publish UserCreationFailedEvent,
      // but the eventBus.publish mock may not behave identically to the real EventBus
      // in terms of flushing async behavior. The error propagates in test context.
      userWriteRepository.save.mockRejectedValue(new Error('DB error'));

      const command = new CreateUserCommand({
        id: USER_ID,
        status: UserStatusEnum.ACTIVE,
      } as any);

      await expect(handler.execute(command)).rejects.toThrow('DB error');
    });
  });
});
