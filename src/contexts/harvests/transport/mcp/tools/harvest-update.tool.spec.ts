import { CommandBus } from '@nestjs/cqrs';

import { UpdateHarvestCommand } from '@contexts/harvests/application/commands/update-harvest/update-harvest.command';
import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestUpdateMcpTool } from './harvest-update.tool';

const HARVEST_ID = '11111111-1111-4111-8111-111111111111';

describe('HarvestUpdateMcpTool', () => {
  let tool: HarvestUpdateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new HarvestUpdateMcpTool(commandBus);
  });

  it('dispatches UpdateHarvestCommand with the provided fields', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({
      id: HARVEST_ID,
      cropType: 'Cucumber',
      quantity: 5,
      unit: HarvestUnitEnum.KG,
      harvestedAt: '2026-06-01T00:00:00.000Z',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateHarvestCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as UpdateHarvestCommand;
    expect(command.id.value).toBe(HARVEST_ID);
    expect(command.cropType?.value).toBe('Cucumber');
    expect(command.quantity?.value).toBe(5);
    expect(command.unit?.value).toBe(HarvestUnitEnum.KG);
    expect(command.harvestedAt?.value).toEqual(
      new Date('2026-06-01T00:00:00.000Z'),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: HARVEST_ID }),
    });
  });

  it('leaves optional fields undefined when not provided', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute({ id: HARVEST_ID });

    const command = commandBus.execute.mock.calls[0][0] as UpdateHarvestCommand;
    expect(command.cropType).toBeUndefined();
    expect(command.quantity).toBeUndefined();
    expect(command.unit).toBeUndefined();
    expect(command.harvestedAt).toBeUndefined();
  });
});
