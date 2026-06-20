import { IPlantQrPort } from '@contexts/plants/application/ports/plant-qr.port';
import { PlantQrViewModel } from '@contexts/plants/domain/view-models/plant-qr.view-model';
import { PlantGraphQLMapper } from '../../mappers/plant/plant.mapper';
import { PlantResponseDto } from '../../dtos/responses/plant/plant.response.dto';
import { PlantQrResolvedFieldResolver } from './plant-qr-resolved-field.resolver';

const QR_ID = 'd4e5f6a7-b8c9-4123-defa-234567890123';
const SPACE_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const USER_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
const NOW = new Date('2024-01-01T00:00:00Z');

function makeQrVm(): PlantQrViewModel {
  return new PlantQrViewModel({
    id: QR_ID,
    spaceId: SPACE_ID,
    targetUrl: 'https://gardenia.app/plants/plant-id',
    generation: 1,
    image: 'base64encodedimage==',
    createdAt: NOW,
    updatedAt: NOW,
  });
}

function makePlantDto(
  overrides: Partial<PlantResponseDto> = {},
): PlantResponseDto {
  return {
    id: 'plant-id',
    name: 'Rose',
    spaceId: SPACE_ID,
    userId: USER_ID,
    qrId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as PlantResponseDto;
}

describe('PlantQrResolvedFieldResolver', () => {
  let resolver: PlantQrResolvedFieldResolver;
  let plantQrPort: jest.Mocked<IPlantQrPort>;
  let plantGraphQLMapper: PlantGraphQLMapper;

  beforeEach(() => {
    plantQrPort = {
      findByQrId: jest.fn(),
      createForPlant: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantQrPort>;
    plantGraphQLMapper = new PlantGraphQLMapper();
    resolver = new PlantQrResolvedFieldResolver(
      plantQrPort,
      plantGraphQLMapper,
    );
  });

  describe('qr', () => {
    it('resolves qr when qrId is set', async () => {
      const qrVm = makeQrVm();
      plantQrPort.findByQrId.mockResolvedValueOnce(qrVm);

      const result = await resolver.qr(makePlantDto({ qrId: QR_ID }));

      expect(result).toEqual(plantGraphQLMapper.toQrResponseDto(qrVm));
      expect(plantQrPort.findByQrId).toHaveBeenCalledWith(QR_ID);
    });

    it('returns null when qrId is null (no port call)', async () => {
      const result = await resolver.qr(makePlantDto());

      expect(result).toBeNull();
      expect(plantQrPort.findByQrId).not.toHaveBeenCalled();
    });

    it('returns null when port returns null (qr deleted)', async () => {
      plantQrPort.findByQrId.mockResolvedValueOnce(null);

      const result = await resolver.qr(makePlantDto({ qrId: QR_ID }));

      expect(result).toBeNull();
    });
  });
});
