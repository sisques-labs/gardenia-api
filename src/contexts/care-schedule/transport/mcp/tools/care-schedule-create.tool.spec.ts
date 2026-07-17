import { CommandBus } from '@nestjs/cqrs';

import { CreateCareScheduleCommand } from '@contexts/care-schedule/application/commands/create-care-schedule/create-care-schedule.command';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { CareScheduleCreateMcpTool } from './care-schedule-create.tool';

const PLANT_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('CareScheduleCreateMcpTool', () => {
  let tool: CareScheduleCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareScheduleCreateMcpTool(commandBus);
  });

  it('dispatches the command with userId and spaceId from the context', async () => {
    commandBus.execute.mockResolvedValueOnce('schedule-id');

    const result = await tool.execute(
      {
        plantId: PLANT_ID,
        activityType: CareScheduleActivityTypeEnum.WATERING,
        intervalDays: 7,
        quantity: 200,
        unit: CareScheduleUnitEnum.ML,
        notes: 'Weekly watering',
        nextDueAt: '2026-06-27T10:00:00.000Z',
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
    expect(command.activityType.value).toBe(
      CareScheduleActivityTypeEnum.WATERING,
    );
    expect(command.intervalDays?.value).toBe(7);
    expect(command.quantity?.value).toBe(200);
    expect(command.unit?.value).toBe(CareScheduleUnitEnum.ML);
    expect(command.notes?.value).toBe('Weekly watering');
    expect(command.nextDueAt?.value).toEqual(
      new Date('2026-06-27T10:00:00.000Z'),
    );
    expect(command.active?.value).toBe(true);
    expect(command.userId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: 'schedule-id' }),
    });
  });

  it('leaves optional fields null when not provided', async () => {
    commandBus.execute.mockResolvedValueOnce('schedule-id');

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
    expect(command.quantity).toBeNull();
    expect(command.unit).toBeNull();
    expect(command.notes).toBeNull();
    expect(command.nextDueAt).toBeNull();
    expect(command.active).toBeNull();
  });
});
