import { CommandBus } from '@nestjs/cqrs';

import { DeleteHarvestCommand } from '@contexts/harvests/application/commands/delete-harvest/delete-harvest.command';
import { HarvestDeleteMcpTool } from './harvest-delete.tool';

const HARVEST_ID = '11111111-1111-4111-8111-111111111111';

describe('HarvestDeleteMcpTool', () => {
  let tool: HarvestDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new HarvestDeleteMcpTool(commandBus);
  });

  it('dispatches DeleteHarvestCommand with the given id', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: HARVEST_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteHarvestCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as DeleteHarvestCommand;
    expect(command.id.value).toBe(HARVEST_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: HARVEST_ID }),
    });
  });
});
