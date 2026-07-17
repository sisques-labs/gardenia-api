import { CommandBus } from '@nestjs/cqrs';

import { MarkPlantingSpotFallowCommand } from '@contexts/planting-spots/application/commands/mark-planting-spot-fallow/mark-planting-spot-fallow.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { PlantingSpotMarkFallowMcpTool } from './planting-spot-mark-fallow.tool';

const PLANTING_SPOT_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('PlantingSpotMarkFallowMcpTool', () => {
  let tool: PlantingSpotMarkFallowMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantingSpotMarkFallowMcpTool(commandBus);
  });

  it('dispatches MarkPlantingSpotFallowCommand with the authenticated user and space', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: PLANTING_SPOT_ID }, CONTEXT);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(MarkPlantingSpotFallowCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as MarkPlantingSpotFallowCommand;
    expect(command.id.value).toBe(PLANTING_SPOT_ID);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: PLANTING_SPOT_ID }),
    });
  });
});
