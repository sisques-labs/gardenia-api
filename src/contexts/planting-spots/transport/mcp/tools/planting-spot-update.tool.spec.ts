import { CommandBus } from '@nestjs/cqrs';

import { UpdatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/update-planting-spot/update-planting-spot.command';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { PlantingSpotUpdateMcpTool } from './planting-spot-update.tool';

const PLANTING_SPOT_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('PlantingSpotUpdateMcpTool', () => {
  let tool: PlantingSpotUpdateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantingSpotUpdateMcpTool(commandBus);
  });

  it('dispatches UpdatePlantingSpotCommand with the authenticated user and space', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute(
      {
        id: PLANTING_SPOT_ID,
        name: 'Bed 1 renamed',
        type: PlantingSpotTypeEnum.CONTAINER,
      },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdatePlantingSpotCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as UpdatePlantingSpotCommand;
    expect(command.id.value).toBe(PLANTING_SPOT_ID);
    expect(command.name?.value).toBe('Bed 1 renamed');
    expect(command.type?.value).toBe(PlantingSpotTypeEnum.CONTAINER);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: PLANTING_SPOT_ID }),
    });
  });

  it('leaves unspecified fields undefined', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute({ id: PLANTING_SPOT_ID }, CONTEXT);

    const command = commandBus.execute.mock
      .calls[0][0] as UpdatePlantingSpotCommand;
    expect(command.name).toBeUndefined();
    expect(command.type).toBeUndefined();
    expect(command.description).toBeUndefined();
  });
});
