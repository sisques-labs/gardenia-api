import { CommandBus } from '@nestjs/cqrs';

import { CreatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.command';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { PlantingSpotCreateMcpTool } from './planting-spot-create.tool';

const PLANTING_SPOT_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('PlantingSpotCreateMcpTool', () => {
  let tool: PlantingSpotCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantingSpotCreateMcpTool(commandBus);
  });

  it('dispatches CreatePlantingSpotCommand with the authenticated user and space', async () => {
    commandBus.execute.mockResolvedValueOnce(PLANTING_SPOT_ID);

    const result = await tool.execute(
      {
        name: 'Bed 1',
        type: PlantingSpotTypeEnum.RAISED_BED,
        capacity: 4,
      },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreatePlantingSpotCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as CreatePlantingSpotCommand;
    expect(command.name.value).toBe('Bed 1');
    expect(command.type.value).toBe(PlantingSpotTypeEnum.RAISED_BED);
    expect(command.capacity?.value).toBe(4);
    expect(command.userId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: PLANTING_SPOT_ID }),
    });
  });
});
