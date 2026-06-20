import { CreateSpaceCommand } from '@contexts/spaces/application/commands/create-space/create-space.command';
import { CommandBus } from '@nestjs/cqrs';

import { SpaceProvisioningAdapter } from './space-provisioning.adapter';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('SpaceProvisioningAdapter', () => {
  let adapter: SpaceProvisioningAdapter;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    adapter = new SpaceProvisioningAdapter(commandBus);
  });

  it('dispatches CreateSpaceCommand and returns the new space id', async () => {
    commandBus.execute.mockResolvedValueOnce(SPACE_ID);

    const result = await adapter.createDefaultSpace({
      ownerId: OWNER_ID,
      name: "owner@example.com's Space",
    });

    expect(result).toBe(SPACE_ID);
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0] as CreateSpaceCommand;
    expect(command).toBeInstanceOf(CreateSpaceCommand);
    expect(command.ownerId.value).toBe(OWNER_ID);
    expect(command.name.value).toBe("owner@example.com's Space");
  });
});
