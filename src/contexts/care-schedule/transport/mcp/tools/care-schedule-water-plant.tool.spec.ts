import { CommandBus } from '@nestjs/cqrs';

import { WaterPlantCommand } from '@contexts/care-schedule/application/commands/water-plant/water-plant.command';
import { WaterPlantResult } from '@contexts/care-schedule/application/commands/water-plant/water-plant.result';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { CareScheduleWaterPlantMcpTool } from './care-schedule-water-plant.tool';

const PLANT_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('CareScheduleWaterPlantMcpTool', () => {
  let tool: CareScheduleWaterPlantMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareScheduleWaterPlantMcpTool(commandBus);
  });

  it('dispatches the water plant command with userId and spaceId from the context', async () => {
    const commandResult: WaterPlantResult = {
      plantId: PLANT_ID,
      mode: 'SCHEDULE_COMPLETED',
      careScheduleId: '22222222-2222-4222-8222-222222222222',
    };
    commandBus.execute.mockResolvedValueOnce(commandResult);

    const result = await tool.execute(
      { plantId: PLANT_ID, performedAt: '2026-06-20T10:00:00.000Z' },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(WaterPlantCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as WaterPlantCommand;
    expect(command.plantId.value).toBe(PLANT_ID);
    expect(command.userId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(command.performedAt?.value).toEqual(
      new Date('2026-06-20T10:00:00.000Z'),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(commandResult),
    });
  });

  it('dispatches a null performedAt when not provided', async () => {
    const commandResult: WaterPlantResult = {
      plantId: PLANT_ID,
      mode: 'CARE_LOG_CREATED',
    };
    commandBus.execute.mockResolvedValueOnce(commandResult);

    await tool.execute({ plantId: PLANT_ID }, CONTEXT);

    const command = commandBus.execute.mock.calls[0][0] as WaterPlantCommand;
    expect(command.performedAt).toBeNull();
  });
});
