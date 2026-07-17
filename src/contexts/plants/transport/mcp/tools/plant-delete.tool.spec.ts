import { CommandBus } from '@nestjs/cqrs';

import { DeletePlantCommand } from '@contexts/plants/application/commands/delete-plant/delete-plant.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { PlantDeleteMcpTool } from './plant-delete.tool';

const PLANT_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('PlantDeleteMcpTool', () => {
  let tool: PlantDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantDeleteMcpTool(commandBus);
  });

  it('dispatches DeletePlantCommand with the authenticated user id', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: PLANT_ID }, CONTEXT);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeletePlantCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as DeletePlantCommand;
    expect(command.plantId.value).toBe(PLANT_ID);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: PLANT_ID }),
    });
  });
});
