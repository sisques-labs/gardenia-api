import { QueryBus } from '@nestjs/cqrs';

import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { QrFindByIdRequestDto } from '../../dtos/requests/qr/qr-find-by-id.request.dto';
import { QrFindByPlantIdRequestDto } from '../../dtos/requests/qr/qr-find-by-plant-id.request.dto';
import { QrGraphQLMapper } from '../../mappers/qr/qr.mapper';
import { QrQueriesResolver } from './qr-queries.resolver';

const QR_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const PLANT_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';

describe('QrQueriesResolver', () => {
  let resolver: QrQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<QrGraphQLMapper>;

  const now = new Date('2024-01-01T00:00:00Z');
  const mockVm = new QrViewModel({
    id: QR_ID,
    plantId: PLANT_ID,
    spaceId: SPACE_ID,
    targetUrl: `http://localhost:3000/plants/${PLANT_ID}?spaceId=${SPACE_ID}`,
    generation: 1,
    createdAt: now,
    updatedAt: now,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDtoFromViewModel: jest.fn(),
    } as unknown as jest.Mocked<QrGraphQLMapper>;

    resolver = new QrQueriesResolver(queryBus, mapper);
  });

  it('qrFindById dispatches query and maps result', async () => {
    queryBus.execute.mockResolvedValueOnce(mockVm);
    mapper.toResponseDtoFromViewModel.mockReturnValueOnce({
      id: QR_ID,
      plantId: PLANT_ID,
      spaceId: SPACE_ID,
      targetUrl: mockVm.targetUrl,
      generation: 1,
      createdAt: now,
      updatedAt: now,
    });

    const input: QrFindByIdRequestDto = { id: QR_ID };
    const result = await resolver.qrFindById(input);

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(QR_ID);
  });

  it('qrFindByPlantId returns null when not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const input: QrFindByPlantIdRequestDto = { plantId: PLANT_ID };
    const result = await resolver.qrFindByPlantId(input);

    expect(result).toBeNull();
    expect(mapper.toResponseDtoFromViewModel).not.toHaveBeenCalled();
  });
});
