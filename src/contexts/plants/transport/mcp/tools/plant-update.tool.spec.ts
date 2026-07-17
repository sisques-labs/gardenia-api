import { CommandBus } from '@nestjs/cqrs';

import { UpdatePlantCommand } from '@contexts/plants/application/commands/update-plant/update-plant.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { PlantUpdateMcpTool } from './plant-update.tool';

const PLANT_ID = '11111111-1111-4111-8111-111111111111';
const PLANTING_SPOT_ID = '22222222-2222-4222-8222-222222222222';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('PlantUpdateMcpTool', () => {
  let tool: PlantUpdateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantUpdateMcpTool(commandBus);
  });

  it('dispatches UpdatePlantCommand with all provided fields', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute(
      {
        id: PLANT_ID,
        name: 'Basil',
        gbifSpeciesKey: 2882337,
        speciesScientificName: 'Ocimum basilicum',
        imageUrl: 'https://example.com/basil.jpg',
        plantingSpotId: PLANTING_SPOT_ID,
      },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdatePlantCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as UpdatePlantCommand;
    expect(command.plantId.value).toBe(PLANT_ID);
    expect(command.name?.value).toBe('Basil');
    expect(command.gbifSpeciesKey?.value).toBe(2882337);
    expect(command.speciesScientificName?.value).toBe('Ocimum basilicum');
    expect(command.imageUrl?.value).toBe('https://example.com/basil.jpg');
    expect(command.plantingSpotId?.value).toBe(PLANTING_SPOT_ID);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: PLANT_ID }),
    });
  });

  it('leaves optional fields undefined when not provided', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute({ id: PLANT_ID }, CONTEXT);

    const command = commandBus.execute.mock.calls[0][0] as UpdatePlantCommand;
    expect(command.name).toBeUndefined();
    expect(command.gbifSpeciesKey).toBeUndefined();
    expect(command.speciesScientificName).toBeUndefined();
    expect(command.imageUrl).toBeUndefined();
    expect(command.plantingSpotId).toBeUndefined();
  });

  it('sets nullable fields to null when explicitly nulled', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute(
      {
        id: PLANT_ID,
        gbifSpeciesKey: null,
        speciesScientificName: null,
        imageUrl: null,
        plantingSpotId: null,
      },
      CONTEXT,
    );

    const command = commandBus.execute.mock.calls[0][0] as UpdatePlantCommand;
    expect(command.gbifSpeciesKey).toBeNull();
    expect(command.speciesScientificName).toBeNull();
    expect(command.imageUrl).toBeNull();
    expect(command.plantingSpotId).toBeNull();
  });
});
