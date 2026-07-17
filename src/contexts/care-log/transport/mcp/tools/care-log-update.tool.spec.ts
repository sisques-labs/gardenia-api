import { CommandBus } from '@nestjs/cqrs';

import { UpdateCareLogEntryCommand } from '@contexts/care-log/application/commands/update-care-log-entry/update-care-log-entry.command';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { CareLogUpdateMcpTool } from './care-log-update.tool';

const CARE_LOG_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('CareLogUpdateMcpTool', () => {
  let tool: CareLogUpdateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareLogUpdateMcpTool(commandBus);
  });

  it('dispatches the update command with the provided fields', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute(
      {
        id: CARE_LOG_ID,
        activityType: CareLogActivityTypeEnum.FERTILIZING,
        performedAt: '2026-06-20T10:00:00.000Z',
        notes: 'Applied fertilizer',
        quantity: 5,
        unit: CareLogUnitEnum.ML,
      },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateCareLogEntryCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as UpdateCareLogEntryCommand;
    expect(command.id.value).toBe(CARE_LOG_ID);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(command.activityType?.value).toBe(
      CareLogActivityTypeEnum.FERTILIZING,
    );
    expect(command.notes?.value).toBe('Applied fertilizer');
    expect(command.quantity?.value).toBe(5);
    expect(command.unit?.value).toBe(CareLogUnitEnum.ML);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: CARE_LOG_ID }),
    });
  });

  it('leaves optional fields undefined when not provided', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute({ id: CARE_LOG_ID }, CONTEXT);

    const command = commandBus.execute.mock
      .calls[0][0] as UpdateCareLogEntryCommand;
    expect(command.activityType).toBeUndefined();
    expect(command.performedAt).toBeUndefined();
    expect(command.notes).toBeUndefined();
    expect(command.quantity).toBeUndefined();
    expect(command.unit).toBeUndefined();
  });
});
