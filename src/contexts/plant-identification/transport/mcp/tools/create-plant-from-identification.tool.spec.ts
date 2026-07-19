import { CommandBus } from '@nestjs/cqrs';

import { CreatePlantFromIdentificationCommand } from '@contexts/plant-identification/application/commands/create-plant-from-identification/create-plant-from-identification.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { CreatePlantFromIdentificationMcpTool } from './create-plant-from-identification.tool';

const IDENTIFICATION_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';

const context: IMcpToolContext = {
  userId: USER_ID,
  email: 'user@example.com',
  spaceId: '770e8400-e29b-41d4-a716-446655440002',
};

describe('CreatePlantFromIdentificationMcpTool', () => {
  let tool: CreatePlantFromIdentificationMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CreatePlantFromIdentificationMcpTool(commandBus);
  });

  it('exposes its metadata', () => {
    expect(tool.name).toBe('plant_identification_create_plant');
    expect(tool.inputSchema).toHaveProperty('identificationId');
  });

  it('dispatches CreatePlantFromIdentificationCommand using the context userId, not args', async () => {
    commandBus.execute.mockResolvedValueOnce({ id: PLANT_ID });

    const result = await tool.execute(
      { identificationId: IDENTIFICATION_ID, name: 'My Monstera' },
      context,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreatePlantFromIdentificationCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as CreatePlantFromIdentificationCommand;
    expect(command.requestingUserId.value).toBe(USER_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ id: PLANT_ID }),
    });
  });
});
