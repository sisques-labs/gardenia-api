import { CommandBus } from '@nestjs/cqrs';

import { WaterPlantingSpotCommand } from '@contexts/planting-spots/application/commands/water-planting-spot/water-planting-spot.command';
import { WaterPlantingSpotResult } from '@contexts/planting-spots/application/commands/water-planting-spot/water-planting-spot.result';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { PlantingSpotWaterMcpTool } from './planting-spot-water.tool';

const PLANTING_SPOT_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('PlantingSpotWaterMcpTool', () => {
  let tool: PlantingSpotWaterMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantingSpotWaterMcpTool(commandBus);
  });

  it('dispatches WaterPlantingSpotCommand without performedAt when not provided', async () => {
    const waterResult: WaterPlantingSpotResult = {
      plantingSpotId: PLANTING_SPOT_ID,
      wateredPlantIds: ['22222222-2222-4222-8222-222222222222'],
      failedPlants: [],
    };
    commandBus.execute.mockResolvedValueOnce(waterResult);

    const result = await tool.execute({ id: PLANTING_SPOT_ID }, CONTEXT);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(WaterPlantingSpotCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as WaterPlantingSpotCommand;
    expect(command.id.value).toBe(PLANTING_SPOT_ID);
    expect(command.userId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(command.performedAt).toBeNull();
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(waterResult),
    });
  });

  it('dispatches WaterPlantingSpotCommand with performedAt when provided', async () => {
    const waterResult: WaterPlantingSpotResult = {
      plantingSpotId: PLANTING_SPOT_ID,
      wateredPlantIds: [],
      failedPlants: [],
    };
    commandBus.execute.mockResolvedValueOnce(waterResult);

    await tool.execute(
      { id: PLANTING_SPOT_ID, performedAt: '2026-07-10T10:00:00.000Z' },
      CONTEXT,
    );

    const command = commandBus.execute.mock
      .calls[0][0] as WaterPlantingSpotCommand;
    expect(command.performedAt?.value).toEqual(
      new Date('2026-07-10T10:00:00.000Z'),
    );
  });
});
