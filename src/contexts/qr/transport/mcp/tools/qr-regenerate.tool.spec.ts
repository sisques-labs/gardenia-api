import { CommandBus } from '@nestjs/cqrs';

import { RegenerateQrCommand } from '@contexts/qr/application/commands/regenerate-qr/regenerate-qr.command';
import { QrRegenerateMcpTool } from './qr-regenerate.tool';

const QR_ID = '11111111-1111-4111-8111-111111111111';

describe('QrRegenerateMcpTool', () => {
  let tool: QrRegenerateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new QrRegenerateMcpTool(commandBus);
  });

  it('dispatches RegenerateQrCommand and returns success', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ qrId: QR_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(RegenerateQrCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as RegenerateQrCommand;
    expect(command.qrId.value).toBe(QR_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: QR_ID }),
    });
  });
});
