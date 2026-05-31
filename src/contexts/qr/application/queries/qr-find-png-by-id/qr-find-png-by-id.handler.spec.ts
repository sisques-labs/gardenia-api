import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import { IQrReadRepository } from '@contexts/qr/domain/repositories/read/qr-read.repository';

import { QrFindPngByIdQuery } from './qr-find-png-by-id.query';
import { QrFindPngByIdQueryHandler } from './qr-find-png-by-id.handler';

const QR_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const PNG_BUFFER = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe('QrFindPngByIdQueryHandler', () => {
  let handler: QrFindPngByIdQueryHandler;
  let readRepository: jest.Mocked<IQrReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findPngById: jest.fn(),
    } as jest.Mocked<IQrReadRepository>;

    handler = new QrFindPngByIdQueryHandler(readRepository);
  });

  it('returns the PNG buffer when found', async () => {
    readRepository.findPngById.mockResolvedValue(PNG_BUFFER);

    const result = await handler.execute(
      new QrFindPngByIdQuery({ qrId: QR_ID }),
    );

    expect(result).toBe(PNG_BUFFER);
    expect(readRepository.findPngById).toHaveBeenCalledWith(QR_ID);
  });

  it('throws QrNotFoundException when not found', async () => {
    readRepository.findPngById.mockResolvedValue(null);

    await expect(
      handler.execute(new QrFindPngByIdQuery({ qrId: QR_ID })),
    ).rejects.toThrow(QrNotFoundException);
  });
});
