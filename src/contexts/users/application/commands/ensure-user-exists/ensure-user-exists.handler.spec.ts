import { CommandBus } from '@nestjs/cqrs';

import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { AssertUserExistsService } from '@contexts/users/application/services/write/assert-user-exists/assert-user-exists.service';
import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';

import { EnsureUserExistsCommand } from './ensure-user-exists.command';
import { EnsureUserExistsCommandHandler } from './ensure-user-exists.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('EnsureUserExistsCommandHandler', () => {
  let handler: EnsureUserExistsCommandHandler;
  let assertUserExistsService: jest.Mocked<AssertUserExistsService>;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    assertUserExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertUserExistsService>;

    commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    handler = new EnsureUserExistsCommandHandler(
      assertUserExistsService,
      commandBus,
    );
  });

  it('returns user id when global identity already exists', async () => {
    assertUserExistsService.execute.mockResolvedValue({
      id: { value: USER_ID },
    } as UserAggregate);

    const result = await handler.execute(new EnsureUserExistsCommand(USER_ID));

    expect(result).toBe(USER_ID);
    expect(assertUserExistsService.execute).toHaveBeenCalledWith(
      new UserIdValueObject(USER_ID),
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('creates user when global identity does not exist', async () => {
    assertUserExistsService.execute.mockRejectedValue(
      new UserNotFoundException(USER_ID),
    );
    commandBus.execute.mockResolvedValue(USER_ID);

    const result = await handler.execute(new EnsureUserExistsCommand(USER_ID));

    expect(result).toBe(USER_ID);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateUserCommand),
    );
  });
});
