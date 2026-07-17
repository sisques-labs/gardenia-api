import { CommandBus } from '@nestjs/cqrs';

import { CreatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/create-plant-species/create-plant-species.command';
import { PlantSpeciesCreateMcpTool } from './plant-species-create.tool';

const SPECIES_ID = '11111111-1111-4111-8111-111111111111';

describe('PlantSpeciesCreateMcpTool', () => {
  let tool: PlantSpeciesCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantSpeciesCreateMcpTool(commandBus);
  });

  it('dispatches CreatePlantSpeciesCommand and returns the created id', async () => {
    commandBus.execute.mockResolvedValueOnce(SPECIES_ID);

    const result = await tool.execute({
      scientificName: 'Monstera deliciosa',
      gbifKey: 2882337,
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreatePlantSpeciesCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as CreatePlantSpeciesCommand;
    expect(command.scientificName.value).toBe('Monstera deliciosa');
    expect(command.gbifKey.value).toBe(2882337);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: SPECIES_ID }),
    });
  });
});
