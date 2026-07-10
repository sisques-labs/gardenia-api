import { IPlantSpeciesPort } from '@contexts/plants/application/ports/plant-species.port';
import { PlantSpeciesViewModel } from '@contexts/plants/domain/view-models/plant-species.view-model';
import { PlantGraphQLMapper } from '../../mappers/plant/plant.mapper';
import { PlantResponseDto } from '../../dtos/responses/plant/plant.response.dto';
import { PlantSpeciesResolvedFieldResolver } from './plant-species-resolved-field.resolver';

const SPECIES_ID = 'e5f6a7b8-c9d0-4234-efab-345678901234';
const SPACE_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const USER_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
const NOW = new Date('2024-01-01T00:00:00Z');

function makeSpeciesVm(): PlantSpeciesViewModel {
  return new PlantSpeciesViewModel({
    id: SPECIES_ID,
    scientificName: 'Rosa canina',
    gbifKey: 3033874,
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
    plantSpeciesId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as PlantResponseDto;
}

describe('PlantSpeciesResolvedFieldResolver', () => {
  let resolver: PlantSpeciesResolvedFieldResolver;
  let plantSpeciesPort: jest.Mocked<IPlantSpeciesPort>;
  let plantGraphQLMapper: PlantGraphQLMapper;

  beforeEach(() => {
    plantSpeciesPort = {
      findByPlantSpeciesId: jest.fn(),
      findOrCreateByGbifKey: jest.fn(),
    } as jest.Mocked<IPlantSpeciesPort>;
    plantGraphQLMapper = new PlantGraphQLMapper();
    resolver = new PlantSpeciesResolvedFieldResolver(
      plantSpeciesPort,
      plantGraphQLMapper,
    );
  });

  describe('species', () => {
    it('resolves species when plantSpeciesId is set', async () => {
      const speciesVm = makeSpeciesVm();
      plantSpeciesPort.findByPlantSpeciesId.mockResolvedValueOnce(speciesVm);

      const result = await resolver.species(
        makePlantDto({ plantSpeciesId: SPECIES_ID }),
      );

      expect(result).toEqual(
        plantGraphQLMapper.toLinkedSpeciesResponseDto(speciesVm),
      );
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
