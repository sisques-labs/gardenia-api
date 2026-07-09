import { IPlantingSpotQrPort } from '@contexts/planting-spots/application/ports/planting-spot-qr.port';
import { PlantingSpotQrViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-qr.view-model';
import { PlantingSpotGraphQLMapper } from '../../mappers/planting-spot/planting-spot.mapper';
import { PlantingSpotResponseDto } from '../../dtos/responses/planting-spot.response.dto';
import { PlantingSpotQrResolvedFieldResolver } from './planting-spot-qr-resolved-field.resolver';

const QR_ID = 'd4e5f6a7-b8c9-4123-defa-234567890123';
const SPACE_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const USER_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
const NOW = new Date('2024-01-01T00:00:00Z');

function makeQrVm(): PlantingSpotQrViewModel {
  return new PlantingSpotQrViewModel({
    id: QR_ID,
    spaceId: SPACE_ID,
    targetUrl: 'https://gardenia.app/planting-spots/spot-id',
    generation: 1,
    image: 'base64encodedimage==',
    createdAt: NOW,
    updatedAt: NOW,
  });
}

function makePlantingSpotDto(
  overrides: Partial<PlantingSpotResponseDto> = {},
): PlantingSpotResponseDto {
  return {
    id: 'spot-id',
    name: 'Bed A',
    spaceId: SPACE_ID,
    userId: USER_ID,
    qrId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as PlantingSpotResponseDto;
}

describe('PlantingSpotQrResolvedFieldResolver', () => {
  let resolver: PlantingSpotQrResolvedFieldResolver;
  let plantingSpotQrPort: jest.Mocked<IPlantingSpotQrPort>;
  let plantingSpotGraphQLMapper: PlantingSpotGraphQLMapper;

  beforeEach(() => {
    plantingSpotQrPort = {
      findByQrId: jest.fn(),
      createForPlantingSpot: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantingSpotQrPort>;
    plantingSpotGraphQLMapper = new PlantingSpotGraphQLMapper();
    resolver = new PlantingSpotQrResolvedFieldResolver(
      plantingSpotQrPort,
      plantingSpotGraphQLMapper,
    );
  });

  describe('qr', () => {
    it('resolves qr when qrId is set', async () => {
      const qrVm = makeQrVm();
      plantingSpotQrPort.findByQrId.mockResolvedValueOnce(qrVm);

      const result = await resolver.qr(makePlantingSpotDto({ qrId: QR_ID }));

      expect(result).toEqual(plantingSpotGraphQLMapper.toQrResponseDto(qrVm));
      expect(plantingSpotQrPort.findByQrId).toHaveBeenCalledWith(QR_ID);
    });

    it('returns null when qrId is null (no port call)', async () => {
      const result = await resolver.qr(makePlantingSpotDto());

      expect(result).toBeNull();
      expect(plantingSpotQrPort.findByQrId).not.toHaveBeenCalled();
    });

    it('returns null when port returns null (qr deleted)', async () => {
      plantingSpotQrPort.findByQrId.mockResolvedValueOnce(null);

      const result = await resolver.qr(makePlantingSpotDto({ qrId: QR_ID }));

      expect(result).toBeNull();
    });
  });
});
