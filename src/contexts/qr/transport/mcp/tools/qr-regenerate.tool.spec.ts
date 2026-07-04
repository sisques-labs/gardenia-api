import { CommandBus } from '@nestjs/cqrs';

import { RegenerateQrCommand } from '@contexts/qr/application/commands/regenerate-qr/regenerate-qr.command';
import { QrRegenerateMcpTool } from './qr-regenerate.tool';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('QrRegenerateMcpTool', () => {
  let tool: QrRegenerateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new QrRegenerateMcpTool(commandBus);
  });

  it('dispatches RegenerateQrCommand', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ qrId: QR_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(RegenerateQrCommand),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: QR_ID }),
    });
  });
});
