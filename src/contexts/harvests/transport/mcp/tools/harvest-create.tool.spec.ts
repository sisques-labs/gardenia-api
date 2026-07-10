import { CommandBus } from '@nestjs/cqrs';

import { CreateHarvestCommand } from '@contexts/harvests/application/commands/create-harvest/create-harvest.command';
import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { HarvestCreateMcpTool } from './harvest-create.tool';

const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('HarvestCreateMcpTool', () => {
  let tool: HarvestCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new HarvestCreateMcpTool(commandBus);
  });

  it('dispatches CreateHarvestCommand with userId and spaceId from the context', async () => {
    commandBus.execute.mockResolvedValueOnce('harvest-id');

    const result = await tool.execute(
      { cropType: 'Tomato', quantity: 3, unit: HarvestUnitEnum.KG },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateHarvestCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as CreateHarvestCommand;
    expect(command.cropType.value).toBe('Tomato');
    expect(command.userId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: 'harvest-id' }),
    });
  });
});
