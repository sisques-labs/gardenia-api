import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { EventBus } from '@nestjs/cqrs';

import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import { IUserWriteRepository } from '@contexts/users/domain/repositories/write/user-write.repository';
import { AssertUserExistsService } from '@contexts/users/application/services/write/assert-user-exists/assert-user-exists.service';
import { DeleteUserCommand } from './delete-user.command';
import { DeleteUserCommandHandler } from './delete-user.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildUser = (): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
    .withUsername('johndoe')
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

const buildEnrichedUser = (): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
    .withUsername('johndoe')
    .withFirstName('John')
    .withLastName('Doe')
    .withAvatarUrl('https://example.com/avatar.png')
    .withBio('A short bio.')
    .withLocale('es-AR')
    .withTimezone('America/Buenos_Aires')
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('DeleteUserCommandHandler', () => {
  let handler: DeleteUserCommandHandler;
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

    handler = new DeleteUserCommandHandler(
      userWriteRepository,
      assertUserExistsService,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should delete the user and publish events', async () => {
      const user = buildUser();
      assertUserExistsService.execute.mockResolvedValue(user);
      userWriteRepository.delete.mockResolvedValue(undefined as any);

      const command = new DeleteUserCommand({ id: USER_ID });

      await handler.execute(command);

      expect(assertUserExistsService.execute).toHaveBeenCalledTimes(1);
      expect(userWriteRepository.delete).toHaveBeenCalledWith(USER_ID);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('user not found', () => {
    it('should throw UserNotFoundException when user does not exist', async () => {
      assertUserExistsService.execute.mockRejectedValue(
        new UserNotFoundException(USER_ID),
      );

      const command = new DeleteUserCommand({ id: USER_ID });

      await expect(handler.execute(command)).rejects.toThrow(
        UserNotFoundException,
      );
      expect(userWriteRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('enriched aggregate', () => {
    it('should delete and publish events even when aggregate has all profile fields populated', async () => {
      const enrichedUser = buildEnrichedUser();
      assertUserExistsService.execute.mockResolvedValue(enrichedUser);
      userWriteRepository.delete.mockResolvedValue(undefined as any);

      const command = new DeleteUserCommand({ id: USER_ID });

      await handler.execute(command);

      expect(userWriteRepository.delete).toHaveBeenCalledWith(USER_ID);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });
});
