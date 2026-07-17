import { CommandBus } from '@nestjs/cqrs';

import { UpdatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/update-plant-species/update-plant-species.command';
import { PlantSpeciesUpdateMcpTool } from './plant-species-update.tool';

const SPECIES_ID = '11111111-1111-4111-8111-111111111111';

describe('PlantSpeciesUpdateMcpTool', () => {
  let tool: PlantSpeciesUpdateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantSpeciesUpdateMcpTool(commandBus);
  });

  it('dispatches UpdatePlantSpeciesCommand with all provided fields', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({
      id: SPECIES_ID,
      scientificName: 'Ficus lyrata',
      gbifKey: 3541987,
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdatePlantSpeciesCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as UpdatePlantSpeciesCommand;
    expect(command.id.value).toBe(SPECIES_ID);
    expect(command.scientificName?.value).toBe('Ficus lyrata');
    expect(command.gbifKey?.value).toBe(3541987);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: SPECIES_ID }),
    });
  });

  it('leaves optional fields undefined when not provided', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute({ id: SPECIES_ID });

    const command = commandBus.execute.mock
      .calls[0][0] as UpdatePlantSpeciesCommand;
    expect(command.scientificName).toBeUndefined();
    expect(command.gbifKey).toBeUndefined();
  });
});
