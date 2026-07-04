import { CommandBus } from '@nestjs/cqrs';

import { CreateQrCommand } from '@contexts/qr/application/commands/create-qr/create-qr.command';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { QrCreateMcpTool } from './qr-create.tool';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';
const CONTEXT: IMcpToolContext = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
  email: 'gardener@example.com',
  spaceId: '770e8400-e29b-41d4-a716-446655440002',
};

describe('QrCreateMcpTool', () => {
  let tool: QrCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new QrCreateMcpTool(commandBus);
  });

  it('dispatches CreateQrCommand with an expiresAt', async () => {
    commandBus.execute.mockResolvedValueOnce(QR_ID);

    const result = await tool.execute(
      {
        targetUrl: 'https://gardenia.app/plant/1',
        expiresAt: '2030-01-01T00:00:00.000Z',
      },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateQrCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as CreateQrCommand;
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(command.expiresAt?.value).toEqual(
      new Date('2030-01-01T00:00:00.000Z'),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: QR_ID }),
    });
  });

  it('dispatches CreateQrCommand without an expiresAt', async () => {
    commandBus.execute.mockResolvedValueOnce(QR_ID);

    await tool.execute({ targetUrl: 'https://gardenia.app/plant/1' }, CONTEXT);

    const command = commandBus.execute.mock.calls[0][0] as CreateQrCommand;
    expect(command.expiresAt).toBeNull();
  });
});
