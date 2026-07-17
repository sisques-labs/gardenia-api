import { QueryBus } from '@nestjs/cqrs';

import { QrFindByIdQuery } from '@contexts/qr/application/queries/qr-find-by-id/qr-find-by-id.query';
import { QrFindByIdMcpTool } from './qr-find-by-id.tool';

const QR_ID = '11111111-1111-4111-8111-111111111111';

describe('QrFindByIdMcpTool', () => {
  let tool: QrFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new QrFindByIdMcpTool(queryBus);
  });

  it('dispatches QrFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: QR_ID, targetUrl: 'https://gardenia.app/spots/1' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ qrId: QR_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(QrFindByIdQuery));
    const query = queryBus.execute.mock.calls[0][0] as QrFindByIdQuery;
    expect(query.qrId.value).toBe(QR_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the QR code is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ qrId: QR_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
