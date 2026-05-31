import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { QrGraphQLMapper } from './qr.mapper';

const QR_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';

describe('QrGraphQLMapper', () => {
  let mapper: QrGraphQLMapper;
  const now = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    mapper = new QrGraphQLMapper();
  });

  it('maps all fields from QrViewModel', () => {
    const vm = new QrViewModel({
      id: QR_ID,
      spaceId: SPACE_ID,
      targetUrl: 'http://localhost:3000/plants/example?spaceId=abc',
      generation: 1,
      createdAt: now,
      updatedAt: now,
    });

    const dto = mapper.toResponseDtoFromViewModel(vm);

    expect(dto.id).toBe(QR_ID);
    expect(dto.spaceId).toBe(SPACE_ID);
    expect(dto.targetUrl).toContain('plants/example');
    expect(dto.generation).toBe(1);
    expect(dto.createdAt).toBe(now);
    expect(dto.updatedAt).toBe(now);
  });
});
