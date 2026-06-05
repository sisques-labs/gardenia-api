import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { StreamableFile } from '@nestjs/common';

import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { RegenerateQrCommand } from '@contexts/qr/application/commands/regenerate-qr/regenerate-qr.command';
import { QrFindByIdQuery } from '@contexts/qr/application/queries/qr-find-by-id/qr-find-by-id.query';
import { QrFindPngByIdQuery } from '@contexts/qr/application/queries/qr-find-png-by-id/qr-find-png-by-id.query';
import { QrRestMapper } from '@contexts/qr/transport/rest/mappers/qr/qr.mapper';
import { QrsController } from './qrs.controller';

const QR_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';

describe('QrsController', () => {
  let controller: QrsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<QrRestMapper>;

  const now = new Date('2024-01-01T00:00:00Z');
  const mockVm = new QrViewModel({
    id: QR_ID,
    spaceId: SPACE_ID,
    targetUrl: 'http://localhost:3000/plants/example?spaceId=abc',
    generation: 1,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<QrRestMapper>;

    controller = new QrsController(commandBus, queryBus, mapper);
  });

  it('findById dispatches QrFindByIdQuery and maps response', async () => {
    queryBus.execute.mockResolvedValueOnce(mockVm);
    mapper.toResponseDto.mockReturnValueOnce({
      id: QR_ID,
      spaceId: SPACE_ID,
      targetUrl: mockVm.targetUrl,
      generation: 1,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const result = await controller.findById(QR_ID);

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(QrFindByIdQuery));
    expect(result.id).toBe(QR_ID);
  });

  it('downloadImage dispatches QrFindPngByIdQuery and returns StreamableFile', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    queryBus.execute.mockResolvedValueOnce(png);

    const result = await controller.downloadImage(QR_ID);

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(QrFindPngByIdQuery),
    );
    expect(result).toBeInstanceOf(StreamableFile);
  });

  it('regenerate dispatches RegenerateQrCommand', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await controller.regenerate(QR_ID);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(RegenerateQrCommand),
    );
  });
});
