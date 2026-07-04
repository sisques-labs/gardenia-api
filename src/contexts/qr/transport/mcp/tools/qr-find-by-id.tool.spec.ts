import { QueryBus } from '@nestjs/cqrs';

import { QrFindByIdQuery } from '@contexts/qr/application/queries/qr-find-by-id/qr-find-by-id.query';
import { QrFindByIdMcpTool } from './qr-find-by-id.tool';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('QrFindByIdMcpTool', () => {
  let tool: QrFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new QrFindByIdMcpTool(queryBus);
  });

  it('returns the qr when found', async () => {
    const qr = { id: QR_ID };
    queryBus.execute.mockResolvedValueOnce(qr);

    const result = await tool.execute({ qrId: QR_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(QrFindByIdQuery));
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(qr),
    });
  });

  it('returns null when not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ qrId: QR_ID });

    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(null),
    });
  });
});
