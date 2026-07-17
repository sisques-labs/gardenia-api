import { CommandBus } from '@nestjs/cqrs';

import { MarkPlantingSpotActiveCommand } from '@contexts/planting-spots/application/commands/mark-planting-spot-active/mark-planting-spot-active.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { PlantingSpotMarkActiveMcpTool } from './planting-spot-mark-active.tool';

const PLANTING_SPOT_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('PlantingSpotMarkActiveMcpTool', () => {
  let tool: PlantingSpotMarkActiveMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantingSpotMarkActiveMcpTool(commandBus);
  });

  it('dispatches MarkPlantingSpotActiveCommand with the authenticated user and space', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: PLANTING_SPOT_ID }, CONTEXT);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(MarkPlantingSpotActiveCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as MarkPlantingSpotActiveCommand;
    expect(command.id.value).toBe(PLANTING_SPOT_ID);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: PLANTING_SPOT_ID }),
    });
  });
});
