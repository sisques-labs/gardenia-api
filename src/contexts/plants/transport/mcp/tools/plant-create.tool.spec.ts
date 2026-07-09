import { CommandBus } from '@nestjs/cqrs';

import { CreatePlantCommand } from '@contexts/plants/application/commands/create-plant/create-plant.command';
import { IGardeniaMcpToolContext } from '@core/mcp/gardenia-mcp-context.interface';
import { PlantCreateMcpTool } from './plant-create.tool';

const PLANT_ID = '11111111-1111-4111-8111-111111111111';
const SPECIES_ID = '22222222-2222-4222-8222-222222222222';
const CONTEXT: IGardeniaMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('PlantCreateMcpTool', () => {
  let tool: PlantCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantCreateMcpTool(commandBus);
  });

  it('dispatches CreatePlantCommand with the authenticated user id', async () => {
    commandBus.execute.mockResolvedValueOnce(PLANT_ID);

    const result = await tool.execute(
      { name: 'Basil', plantSpeciesId: SPECIES_ID },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreatePlantCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as CreatePlantCommand;
    expect(command.name.value).toBe('Basil');
    expect(command.userId.value).toBe(CONTEXT.userId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: PLANT_ID }),
    });
  });
});
