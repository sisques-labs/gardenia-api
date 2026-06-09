import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { UserExistsByIdQuery } from '@contexts/users/application/queries/user-exists-by-id/user-exists-by-id.query';

import { SpaceUserAdapter } from './space-user.adapter';

describe('SpaceUserAdapter', () => {
  it('creates user when global identity does not exist', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CommandBus>;
    const queryBus = {
      execute: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<QueryBus>;

    const adapter = new SpaceUserAdapter(commandBus, queryBus);

    await adapter.ensureUserExists('550e8400-e29b-41d4-a716-446655440000');

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(UserExistsByIdQuery),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateUserCommand),
    );
  });

  it('skips create when global identity already exists', async () => {
    const commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;
    const queryBus = {
      execute: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<QueryBus>;

    const adapter = new SpaceUserAdapter(commandBus, queryBus);

    await adapter.ensureUserExists('550e8400-e29b-41d4-a716-446655440000');

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
