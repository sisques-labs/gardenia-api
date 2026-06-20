import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { DeleteUserCommand } from '@contexts/users/application/commands/delete-user/delete-user.command';
import { CommandBus } from '@nestjs/cqrs';

import { UserProvisioningAdapter } from './user-provisioning.adapter';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('UserProvisioningAdapter', () => {
  let adapter: UserProvisioningAdapter;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    adapter = new UserProvisioningAdapter(commandBus);
  });

  it('dispatches CreateUserCommand with the user id', async () => {
    await adapter.createUser(USER_ID);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0] as CreateUserCommand;
    expect(command).toBeInstanceOf(CreateUserCommand);
    expect(command.id).toBe(USER_ID);
  });

  it('dispatches DeleteUserCommand with the user id', async () => {
    await adapter.deleteUser(USER_ID);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0] as DeleteUserCommand;
    expect(command).toBeInstanceOf(DeleteUserCommand);
    expect(command.id.value).toBe(USER_ID);
  });
});
