import { CommandBus } from '@nestjs/cqrs';

import { CreateQrCommand } from '@contexts/qr/application/commands/create-qr/create-qr.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { QrCreateMcpTool } from './qr-create.tool';

const QR_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('QrCreateMcpTool', () => {
  let tool: QrCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new QrCreateMcpTool(commandBus);
  });

  it('dispatches CreateQrCommand without expiresAt when not provided', async () => {
    commandBus.execute.mockResolvedValueOnce(QR_ID);

    const result = await tool.execute(
      { targetUrl: 'https://gardenia.app/spots/1' },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateQrCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as CreateQrCommand;
    expect(command.targetUrl.value).toBe('https://gardenia.app/spots/1');
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(command.expiresAt).toBeNull();
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: QR_ID }),
    });
  });

  it('dispatches CreateQrCommand with expiresAt when provided', async () => {
    commandBus.execute.mockResolvedValueOnce(QR_ID);

    await tool.execute(
      {
        targetUrl: 'https://gardenia.app/spots/1',
        expiresAt: '2026-12-31T00:00:00.000Z',
      },
      CONTEXT,
    );

    const command = commandBus.execute.mock.calls[0][0] as CreateQrCommand;
    expect(command.expiresAt?.value).toEqual(
      new Date('2026-12-31T00:00:00.000Z'),
    );
  });
});
