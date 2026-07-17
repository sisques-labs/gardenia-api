import { CommandBus } from '@nestjs/cqrs';

import { UpdateSpaceCommand } from '@contexts/spaces/application/commands/update-space/update-space.command';
import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { SpaceUpdateMcpTool } from './space-update.tool';

const SPACE_ID = '44444444-4444-4444-8444-444444444444';

const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: SPACE_ID,
};

describe('SpaceUpdateMcpTool', () => {
  let tool: SpaceUpdateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new SpaceUpdateMcpTool(commandBus);
  });

  it('dispatches UpdateSpaceCommand with requestingUserId from the context', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute(
      {
        spaceId: SPACE_ID,
        name: 'Greenhouse',
        latitude: 40.4,
        longitude: -3.7,
        environment: SpaceEnvironmentEnum.OUTDOOR,
      },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateSpaceCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as UpdateSpaceCommand;
    expect(command.spaceId.value).toBe(SPACE_ID);
    expect(command.name?.value).toBe('Greenhouse');
    expect(command.latitude?.value).toBe(40.4);
    expect(command.longitude?.value).toBe(-3.7);
    expect(command.environment?.value).toBe(SpaceEnvironmentEnum.OUTDOOR);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: SPACE_ID }),
    });
  });

  it('clears latitude, longitude and environment when passed null', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute(
      {
        spaceId: SPACE_ID,
        latitude: null,
        longitude: null,
        environment: null,
      },
      CONTEXT,
    );

    const command = commandBus.execute.mock.calls[0][0] as UpdateSpaceCommand;
    expect(command.name).toBeUndefined();
    expect(command.latitude).toBeNull();
    expect(command.longitude).toBeNull();
    expect(command.environment).toBeNull();
  });
});
