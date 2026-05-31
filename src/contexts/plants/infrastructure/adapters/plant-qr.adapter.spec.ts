import { PlantQrBuilder } from '@contexts/plants/domain/builders/plant-qr.builder';
import { QrFindByIdQuery } from '@contexts/qr/application/queries/qr-find-by-id/qr-find-by-id.query';
import { QrFindPngByIdQuery } from '@contexts/qr/application/queries/qr-find-png-by-id/qr-find-png-by-id.query';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { QueryBus } from '@nestjs/cqrs';
import { PlantQrAdapter } from './plant-qr.adapter';

const QR_ID = 'd4e5f6a7-b8c9-4890-abcd-234567890123';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-bcde-123456789012';
const TARGET_URL = 'https://gardenia.app/qr/d4e5f6a7';
const PNG_BYTES = Buffer.from('fake-png');
const EXPECTED_BASE64 = PNG_BYTES.toString('base64');

function makeQrViewModel(): QrViewModel {
  const now = new Date('2024-01-01T00:00:00Z');
  return new QrViewModel({
    id: QR_ID,
    spaceId: SPACE_ID,
    targetUrl: TARGET_URL,
    generation: 1,
    createdAt: now,
    updatedAt: now,
  });
}

describe('PlantQrAdapter', () => {
  let adapter: PlantQrAdapter;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    adapter = new PlantQrAdapter(queryBus, new PlantQrBuilder());
  });

  it('dispatches both queries and returns PlantQrData with base64 image', async () => {
    queryBus.execute
      .mockResolvedValueOnce(makeQrViewModel())
      .mockResolvedValueOnce(PNG_BYTES);

    const result = await adapter.findByQrId(QR_ID);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(QR_ID);
    expect(result!.spaceId).toBe(SPACE_ID);
    expect(result!.targetUrl).toBe(TARGET_URL);
    expect(result!.generation).toBe(1);
    expect(result!.image).toBe(EXPECTED_BASE64);

    expect(queryBus.execute).toHaveBeenCalledTimes(2);
    expect(queryBus.execute.mock.calls[0][0]).toBeInstanceOf(QrFindByIdQuery);
    expect(queryBus.execute.mock.calls[1][0]).toBeInstanceOf(
      QrFindPngByIdQuery,
    );
  });

  it('returns null when QrFindByIdQuery resolves null', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await adapter.findByQrId(QR_ID);

    expect(result).toBeNull();
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
  });

  it('returns null when QrFindByIdQuery throws', async () => {
    queryBus.execute.mockRejectedValueOnce(new Error('QR not found'));

    const result = await adapter.findByQrId(QR_ID);

    expect(result).toBeNull();
  });

  it('returns null when QrFindPngByIdQuery resolves null', async () => {
    queryBus.execute
      .mockResolvedValueOnce(makeQrViewModel())
      .mockResolvedValueOnce(null);

    const result = await adapter.findByQrId(QR_ID);

    expect(result).toBeNull();
  });
});
