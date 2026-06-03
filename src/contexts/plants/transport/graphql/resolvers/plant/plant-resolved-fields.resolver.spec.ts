import { IPlantQrPort } from '@contexts/plants/application/ports/plant-qr.port';
import { IPlantSpeciesPort } from '@contexts/plants/application/ports/plant-species.port';
import { IPlantingSpotPort } from '@contexts/plants/application/ports/planting-spot.port';
import { PlantPlantingSpotViewModel } from '@contexts/plants/domain/view-models/plant-planting-spot.view-model';
import { PlantQrViewModel } from '@contexts/plants/domain/view-models/plant-qr.view-model';
import { PlantSpeciesViewModel } from '@contexts/plants/domain/view-models/plant-species.view-model';
import { PlantResponseDto } from '../../dtos/responses/plant/plant.response.dto';
import { PlantGraphQLMapper } from '../../mappers/plant/plant.mapper';
import { PlantResolvedFieldsResolver } from './plant-resolved-fields.resolver';

const SPOT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const SPACE_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const USER_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
const QR_ID = 'd4e5f6a7-b8c9-4123-defa-234567890123';
const SPECIES_ID = 'e5f6a7b8-c9d0-4234-efab-345678901234';
const NOW = new Date('2024-01-01T00:00:00Z');

function makeSpotVm(): PlantPlantingSpotViewModel {
  return new PlantPlantingSpotViewModel({
    id: SPOT_ID,
    name: 'Balcony',
    type: 'OUTDOOR',
    description: 'Southern balcony',
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
  });
}

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

function makeSpeciesVm(): PlantSpeciesViewModel {
  return new PlantSpeciesViewModel({
    id: SPECIES_ID,
    name: 'Rosa canina',
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
    plantingSpotId: null,
    qrId: null,
    plantSpeciesId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as PlantResponseDto;
}

describe('PlantResolvedFieldsResolver', () => {
  let resolver: PlantResolvedFieldsResolver;
  let plantingSpotPort: jest.Mocked<IPlantingSpotPort>;
  let plantQrPort: jest.Mocked<IPlantQrPort>;
  let plantSpeciesPort: jest.Mocked<IPlantSpeciesPort>;
  let plantGraphQLMapper: PlantGraphQLMapper;

  beforeEach(() => {
    plantingSpotPort = {
      findById: jest.fn(),
    } as jest.Mocked<IPlantingSpotPort>;
    plantQrPort = {
      findByQrId: jest.fn(),
    } as jest.Mocked<IPlantQrPort>;
    plantSpeciesPort = {
      findByPlantSpeciesId: jest.fn(),
    } as jest.Mocked<IPlantSpeciesPort>;
    plantGraphQLMapper = new PlantGraphQLMapper();
    resolver = new PlantResolvedFieldsResolver(
      plantingSpotPort,
      plantQrPort,
      plantSpeciesPort,
      plantGraphQLMapper,
    );
  });

  describe('plantingSpot', () => {
    it('resolves plantingSpot when plantingSpotId is set', async () => {
      const spotVm = makeSpotVm();
      plantingSpotPort.findById.mockResolvedValueOnce(spotVm);

      const result = await resolver.plantingSpot(
        makePlantDto({ plantingSpotId: SPOT_ID }),
      );

      expect(result).toEqual(
        plantGraphQLMapper.toLinkedPlantingSpotResponseDto(spotVm),
      );
      expect(plantingSpotPort.findById).toHaveBeenCalledWith(SPOT_ID, SPACE_ID);
    });

    it('returns null when plantingSpotId is null (no port call)', async () => {
      const result = await resolver.plantingSpot(makePlantDto());

      expect(result).toBeNull();
      expect(plantingSpotPort.findById).not.toHaveBeenCalled();
    });

    it('returns null when port returns null (spot deleted)', async () => {
      plantingSpotPort.findById.mockResolvedValueOnce(null);

      const result = await resolver.plantingSpot(
        makePlantDto({ plantingSpotId: SPOT_ID }),
      );

      expect(result).toBeNull();
    });
  });

  describe('qr', () => {
    it('resolves qr when qrId is set', async () => {
      plantQrPort.findByQrId.mockResolvedValueOnce(makeQrVm());

      const result = await resolver.qr(makePlantDto({ qrId: QR_ID }));

      expect(result).not.toBeNull();
      expect(result!.id).toBe(QR_ID);
      expect(result!.spaceId).toBe(SPACE_ID);
      expect(result!.targetUrl).toBe('https://gardenia.app/plants/plant-id');
      expect(result!.generation).toBe(1);
      expect(result!.image).toBe('base64encodedimage==');
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

  describe('species', () => {
    it('resolves species when plantSpeciesId is set', async () => {
      plantSpeciesPort.findByPlantSpeciesId.mockResolvedValueOnce(
        makeSpeciesVm(),
      );

      const result = await resolver.species(
        makePlantDto({ plantSpeciesId: SPECIES_ID }),
      );

      expect(result).not.toBeNull();
      expect(result!.id).toBe(SPECIES_ID);
      expect(result!.name).toBe('Rosa canina');
      expect(result!.createdAt).toBe(NOW);
      expect(result!.updatedAt).toBe(NOW);
      expect(plantSpeciesPort.findByPlantSpeciesId).toHaveBeenCalledWith(
        SPECIES_ID,
      );
    });

    it('returns null when plantSpeciesId is null (no port call)', async () => {
      const result = await resolver.species(makePlantDto());

      expect(result).toBeNull();
      expect(plantSpeciesPort.findByPlantSpeciesId).not.toHaveBeenCalled();
    });

    it('returns null when port returns null (species deleted)', async () => {
      plantSpeciesPort.findByPlantSpeciesId.mockResolvedValueOnce(null);

      const result = await resolver.species(
        makePlantDto({ plantSpeciesId: SPECIES_ID }),
      );

      expect(result).toBeNull();
    });
  });
});
