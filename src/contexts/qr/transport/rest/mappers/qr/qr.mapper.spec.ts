import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { QrRestMapper } from './qr.mapper';

const QR_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const PLANT_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';

describe('QrRestMapper', () => {
  let mapper: QrRestMapper;
  const now = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    mapper = new QrRestMapper();
  });

  it('maps all fields from QrViewModel', () => {
    const vm = new QrViewModel({
      id: QR_ID,
      plantId: PLANT_ID,
      spaceId: SPACE_ID,
      targetUrl: `http://localhost:3000/plants/${PLANT_ID}?spaceId=${SPACE_ID}`,
      generation: 2,
      createdAt: now,
      updatedAt: now,
    });

    const dto = mapper.toResponseDto(vm);

    expect(dto.id).toBe(QR_ID);
    expect(dto.plantId).toBe(PLANT_ID);
    expect(dto.spaceId).toBe(SPACE_ID);
    expect(dto.targetUrl).toContain(PLANT_ID);
    expect(dto.generation).toBe(2);
    expect(dto.createdAt).toBe(now);
    expect(dto.updatedAt).toBe(now);
  });
});
