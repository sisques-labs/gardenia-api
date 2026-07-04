import { CommandBus } from '@nestjs/cqrs';

import { CreateCareScheduleCommand } from '@contexts/care-schedule/application/commands/create-care-schedule/create-care-schedule.command';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { CareScheduleCreateMcpTool } from './care-schedule-create.tool';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440010';
const CONTEXT: IMcpToolContext = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
  email: 'gardener@example.com',
  spaceId: '770e8400-e29b-41d4-a716-446655440002',
};

describe('CareScheduleCreateMcpTool', () => {
  let tool: CareScheduleCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareScheduleCreateMcpTool(commandBus);
  });

  it('dispatches CreateCareScheduleCommand with the authenticated user and space', async () => {
    commandBus.execute.mockResolvedValueOnce(SCHEDULE_ID);

    const result = await tool.execute(
      {
        plantId: PLANT_ID,
        activityType: CareScheduleActivityTypeEnum.WATERING,
        intervalDays: 3,
        quantity: 250,
        unit: CareScheduleUnitEnum.ML,
        notes: 'Deep watering',
        nextDueAt: '2026-07-05T00:00:00.000Z',
        active: true,
      },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateCareScheduleCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as CreateCareScheduleCommand;
    expect(command.plantId.value).toBe(PLANT_ID);
    expect(command.userId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: SCHEDULE_ID }),
    });
  });

  it('creates a one-time schedule when optional fields are omitted', async () => {
    commandBus.execute.mockResolvedValueOnce(SCHEDULE_ID);

    await tool.execute(
      {
        plantId: PLANT_ID,
        activityType: CareScheduleActivityTypeEnum.WATERING,
      },
      CONTEXT,
    );

    const command = commandBus.execute.mock
      .calls[0][0] as CreateCareScheduleCommand;
    expect(command.intervalDays).toBeNull();
    expect(command.nextDueAt).toBeNull();
  });
});
