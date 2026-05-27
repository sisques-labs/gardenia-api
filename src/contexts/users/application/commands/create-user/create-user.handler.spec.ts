import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { EventBus } from '@nestjs/cqrs';

import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { IUserWriteRepository } from '@contexts/users/domain/repositories/write/user-write.repository';
import { AssertUsernameAvailableService } from '@contexts/users/application/services/read/assert-username-available/assert-username-available.service';
import { UsernameAlreadyTakenException } from '@contexts/users/domain/exceptions/username-already-taken.exception';
import { CreateUserCommand } from './create-user.command';
import { CreateUserCommandHandler } from './create-user.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildUser = (): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
    .withUsername('johndoe')
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('CreateUserCommandHandler', () => {
  let handler: CreateUserCommandHandler;
  let userWriteRepository: jest.Mocked<IUserWriteRepository>;
  let userBuilder: jest.Mocked<UserBuilder>;
  let assertUsernameAvailableService: jest.Mocked<AssertUsernameAvailableService>;
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

    assertUsernameAvailableService = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertUsernameAvailableService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreateUserCommandHandler(
      userWriteRepository,
      userBuilder,
      assertUsernameAvailableService,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should save the user and publish events', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      const command = new CreateUserCommand({
        status: UserStatusEnum.ACTIVE,
        username: 'johndoe',
      });

      await handler.execute(command);

      expect(userWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should call assertUsernameAvailableService before saving', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      const command = new CreateUserCommand({
        status: UserStatusEnum.ACTIVE,
        username: 'johndoe',
      });

      await handler.execute(command);

      expect(assertUsernameAvailableService.execute).toHaveBeenCalledTimes(1);
    });

    it('should call the builder build() method to create the user', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      const command = new CreateUserCommand({
        status: UserStatusEnum.ACTIVE,
        username: 'johndoe',
      });

      await handler.execute(command);

      expect(userBuilder.build).toHaveBeenCalledTimes(1);
    });
  });

  describe('username already taken', () => {
    it('should propagate UsernameAlreadyTakenException when username is taken', async () => {
      assertUsernameAvailableService.execute.mockRejectedValue(
        new UsernameAlreadyTakenException('johndoe'),
      );

      const command = new CreateUserCommand({
        status: UserStatusEnum.ACTIVE,
        username: 'johndoe',
      });

      await expect(handler.execute(command)).rejects.toThrow(UsernameAlreadyTakenException);
      expect(userWriteRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('repository failure', () => {
    it('should propagate the error when save throws', async () => {
      userWriteRepository.save.mockRejectedValue(new Error('DB error'));

      const command = new CreateUserCommand({
        status: UserStatusEnum.ACTIVE,
        username: 'johndoe',
      });

      await expect(handler.execute(command)).rejects.toThrow('DB error');
    });
  });

  describe('profile fields forwarding', () => {
    it('should pass all optional profile fields from command to builder', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      const command = new CreateUserCommand({
        status: UserStatusEnum.ACTIVE,
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.png',
        bio: 'A short bio.',
        locale: 'es-AR',
        timezone: 'America/Buenos_Aires',
      });

      await handler.execute(command);

      expect(userBuilder.withFirstName).toHaveBeenCalledWith('John');
      expect(userBuilder.withLastName).toHaveBeenCalledWith('Doe');
      expect(userBuilder.withAvatarUrl).toHaveBeenCalledWith('https://example.com/avatar.png');
      expect(userBuilder.withBio).toHaveBeenCalledWith('A short bio.');
      expect(userBuilder.withLocale).toHaveBeenCalledWith('es-AR');
      expect(userBuilder.withTimezone).toHaveBeenCalledWith('America/Buenos_Aires');
    });

    it('should pass null for all optional profile fields when not provided in command', async () => {
      userWriteRepository.save.mockResolvedValue(undefined as any);

      const command = new CreateUserCommand({
        status: UserStatusEnum.ACTIVE,
        username: 'johndoe',
      });

      await handler.execute(command);

      expect(userBuilder.withFirstName).toHaveBeenCalledWith(null);
      expect(userBuilder.withLastName).toHaveBeenCalledWith(null);
      expect(userBuilder.withAvatarUrl).toHaveBeenCalledWith(null);
      expect(userBuilder.withBio).toHaveBeenCalledWith(null);
      expect(userBuilder.withLocale).toHaveBeenCalledWith(null);
      expect(userBuilder.withTimezone).toHaveBeenCalledWith(null);
    });
  });
});
