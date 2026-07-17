import { CommandBus } from '@nestjs/cqrs';

import { UpdateCareScheduleCommand } from '@contexts/care-schedule/application/commands/update-care-schedule/update-care-schedule.command';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CareScheduleUpdateMcpTool } from './care-schedule-update.tool';

const CARE_SCHEDULE_ID = '11111111-1111-4111-8111-111111111111';

describe('CareScheduleUpdateMcpTool', () => {
  let tool: CareScheduleUpdateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareScheduleUpdateMcpTool(commandBus);
  });

  it('dispatches the update command with the provided fields', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({
      id: CARE_SCHEDULE_ID,
      activityType: CareScheduleActivityTypeEnum.FERTILIZING,
      intervalDays: 14,
      quantity: 100,
      unit: CareScheduleUnitEnum.G,
      notes: 'Monthly feed',
      active: false,
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateCareScheduleCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as UpdateCareScheduleCommand;
    expect(command.id.value).toBe(CARE_SCHEDULE_ID);
    expect(command.activityType?.value).toBe(
      CareScheduleActivityTypeEnum.FERTILIZING,
    );
    expect(command.intervalDays?.value).toBe(14);
    expect(command.quantity?.value).toBe(100);
    expect(command.unit?.value).toBe(CareScheduleUnitEnum.G);
    expect(command.notes?.value).toBe('Monthly feed');
    expect(command.active?.value).toBe(false);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: CARE_SCHEDULE_ID }),
    });
  });

  it('leaves optional fields undefined when not provided', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute({ id: CARE_SCHEDULE_ID });

    const command = commandBus.execute.mock
      .calls[0][0] as UpdateCareScheduleCommand;
    expect(command.activityType).toBeUndefined();
    expect(command.intervalDays).toBeUndefined();
    expect(command.quantity).toBeUndefined();
    expect(command.unit).toBeUndefined();
    expect(command.notes).toBeUndefined();
    expect(command.active).toBeUndefined();
  });
});
