import { CommandBus } from '@nestjs/cqrs';

import { DeletePlantPhotoCommand } from '@contexts/plant-photos/application/commands/delete-plant-photo/delete-plant-photo.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { PlantPhotoDeleteMcpTool } from './plant-photo-delete.tool';

const PHOTO_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('PlantPhotoDeleteMcpTool', () => {
  let tool: PlantPhotoDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new PlantPhotoDeleteMcpTool(commandBus);
  });

  it('dispatches DeletePlantPhotoCommand with the authenticated user id', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: PHOTO_ID }, CONTEXT);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeletePlantPhotoCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as DeletePlantPhotoCommand;
    expect(command.id.value).toBe(PHOTO_ID);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: PHOTO_ID }),
    });
  });
});
