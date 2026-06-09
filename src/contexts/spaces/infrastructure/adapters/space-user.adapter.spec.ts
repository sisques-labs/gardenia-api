import { CommandBus } from '@nestjs/cqrs';

import { EnsureUserExistsCommand } from '@contexts/users/application/commands/ensure-user-exists/ensure-user-exists.command';

import { SpaceUserAdapter } from './space-user.adapter';

describe('SpaceUserAdapter', () => {
  it('dispatches EnsureUserExistsCommand', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CommandBus>;

    const adapter = new SpaceUserAdapter(commandBus);

    await adapter.ensureUserExists('550e8400-e29b-41d4-a716-446655440000');

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(EnsureUserExistsCommand),
    );
  });
});
