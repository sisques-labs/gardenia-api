import { EventBus } from '@nestjs/cqrs';

import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { IUserWriteRepository } from '@contexts/users/domain/repositories/write/user-write.repository';
import { CreateUserCommand } from './create-user.command';
import { CreateUserCommandHandler } from './create-user.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildUser = (): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
    .withUsername('user_550e8400')
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
      withUsername: jest.fn().mockReturnThis(),
      withFirstName: jest.fn().mockReturnThis(),
      withLastName: jest.fn().mockReturnThis(),
      withAvatarUrl: jest.fn().mockReturnThis(),
      withBio: jest.fn().mockReturnThis(),
      withLocale: jest.fn().mockReturnThis(),
      withTimezone: jest.fn().mockReturnThis(),
      withCreatedAt: jest.fn().mockReturnThis(),
      withUpdatedAt: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(builtUser),
    } as unknown as jest.Mocked<UserBuilder>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreateUserCommandHandler(
      userWriteRepository,
      userBuilder,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should save the user and publish events', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      await handler.execute(new CreateUserCommand());

      expect(userWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should return the generated user id as a UUID string', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      const result = await handler.execute(new CreateUserCommand());

      expect(typeof result).toBe('string');
      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should build the user with ACTIVE status and auto-generated username', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      await handler.execute(new CreateUserCommand());

      expect(userBuilder.withStatus).toHaveBeenCalledWith(
        UserStatusEnum.ACTIVE,
      );
      expect(userBuilder.withUsername).toHaveBeenCalledWith(
        expect.stringMatching(/^user_[a-f0-9]{8}$/),
      );
    });

    it('should pass the same id to the builder as the returned userId', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      const userId = await handler.execute(new CreateUserCommand());

      expect(userBuilder.withId).toHaveBeenCalledWith(userId);
    });
  });

  describe('repository failure', () => {
    it('should propagate the error when save throws', async () => {
      userWriteRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(handler.execute(new CreateUserCommand())).rejects.toThrow(
        'DB error',
      );
    });
  });
});
