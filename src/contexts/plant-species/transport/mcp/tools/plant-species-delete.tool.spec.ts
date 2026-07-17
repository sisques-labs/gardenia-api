import { CommandBus } from '@nestjs/cqrs';

import { DeletePlantSpeciesCommand } from '@contexts/plant-species/application/commands/delete-plant-species/delete-plant-species.command';
import { PlantSpeciesDeleteMcpTool } from './plant-species-delete.tool';

const SPECIES_ID = '11111111-1111-4111-8111-111111111111';

describe('PlantSpeciesDeleteMcpTool', () => {
  let tool: PlantSpeciesDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantSpeciesDeleteMcpTool(commandBus);
  });

  it('dispatches DeletePlantSpeciesCommand', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: SPECIES_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeletePlantSpeciesCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as DeletePlantSpeciesCommand;
    expect(command.id.value).toBe(SPECIES_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: SPECIES_ID }),
    });
  });
});
