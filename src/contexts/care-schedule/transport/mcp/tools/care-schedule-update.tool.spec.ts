import { CommandBus } from '@nestjs/cqrs';

import { UpdateCareScheduleCommand } from '@contexts/care-schedule/application/commands/update-care-schedule/update-care-schedule.command';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CareScheduleUpdateMcpTool } from './care-schedule-update.tool';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('CareScheduleUpdateMcpTool', () => {
  let tool: CareScheduleUpdateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareScheduleUpdateMcpTool(commandBus);
  });

  it('dispatches UpdateCareScheduleCommand with provided fields', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({
      id: SCHEDULE_ID,
      activityType: CareScheduleActivityTypeEnum.FERTILIZING,
      intervalDays: 7,
      quantity: 100,
      unit: CareScheduleUnitEnum.ML,
      notes: 'Updated notes',
      active: false,
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateCareScheduleCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as UpdateCareScheduleCommand;
    expect(command.id.value).toBe(SCHEDULE_ID);
    expect(command.activityType?.value).toBe(
      CareScheduleActivityTypeEnum.FERTILIZING,
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: SCHEDULE_ID }),
    });
  });

  it('dispatches with only the id when no fields are provided', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute({ id: SCHEDULE_ID });

    const command = commandBus.execute.mock
      .calls[0][0] as UpdateCareScheduleCommand;
    expect(command.activityType).toBeUndefined();
    expect(command.intervalDays).toBeUndefined();
  });
});
