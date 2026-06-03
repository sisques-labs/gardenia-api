import { IPlantingSpotPort } from '@contexts/plants/application/ports/planting-spot.port';
import { PlantPlantingSpotViewModel } from '@contexts/plants/domain/view-models/plant-planting-spot.view-model';
import { PlantGraphQLMapper } from '../../mappers/plant/plant.mapper';
import { PlantResponseDto } from '../../dtos/responses/plant/plant.response.dto';
import { PlantResolvedFieldsResolver } from './plant-resolved-fields.resolver';

const SPOT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const SPACE_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const USER_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
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

function makePlantDto(
  overrides: Partial<PlantResponseDto> = {},
): PlantResponseDto {
  return {
    id: 'plant-id',
    name: 'Rose',
    spaceId: SPACE_ID,
    userId: USER_ID,
    plantingSpotId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as PlantResponseDto;
}

describe('PlantResolvedFieldsResolver', () => {
  let resolver: PlantResolvedFieldsResolver;
  let plantingSpotPort: jest.Mocked<IPlantingSpotPort>;
  let plantGraphQLMapper: PlantGraphQLMapper;

  beforeEach(() => {
    plantingSpotPort = {
      findById: jest.fn(),
    } as jest.Mocked<IPlantingSpotPort>;
    plantGraphQLMapper = new PlantGraphQLMapper();
    resolver = new PlantResolvedFieldsResolver(
      plantingSpotPort,
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
});
