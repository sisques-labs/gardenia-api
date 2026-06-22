import { IPlantingSpotPlantsPort } from '@contexts/planting-spots/application/ports/planting-spot-plants.port';
import { PlantingSpotPlantViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-plant.view-model';
import { PlantingSpotGraphQLMapper } from '../../mappers/planting-spot/planting-spot.mapper';
import { PlantingSpotResponseDto } from '../../dtos/responses/planting-spot.response.dto';
import { PlantingSpotResolvedPlantsResolver } from './planting-spot-resolved-plants.resolver';

const SPOT_ID = 'aa0e8400-e29b-41d4-a716-446655440005';

describe('PlantingSpotResolvedPlantsResolver', () => {
  let sut: PlantingSpotResolvedPlantsResolver;
  let port: jest.Mocked<IPlantingSpotPlantsPort>;
  let mapper: jest.Mocked<PlantingSpotGraphQLMapper>;

  beforeEach(() => {
    port = {
      findByPlantingSpotId: jest.fn(),
    } as unknown as jest.Mocked<IPlantingSpotPlantsPort>;
    mapper = {
      toPlantInSpotResponseDto: jest.fn((p) => ({ id: p.id }) as never),
    } as unknown as jest.Mocked<PlantingSpotGraphQLMapper>;
    sut = new PlantingSpotResolvedPlantsResolver(port, mapper);
  });

  it('fetches and maps each plant of the spot', async () => {
    const plants = [{ id: 'p1' }, { id: 'p2' }] as PlantingSpotPlantViewModel[];
    port.findByPlantingSpotId.mockResolvedValue(plants);

    const result = await sut.resolvedPlants({
      id: SPOT_ID,
    } as PlantingSpotResponseDto);

    expect(port.findByPlantingSpotId).toHaveBeenCalledWith(SPOT_ID);
    expect(mapper.toPlantInSpotResponseDto).toHaveBeenCalledTimes(2);
    expect(result).toEqual([{ id: 'p1' }, { id: 'p2' }]);
  });

  it('returns an empty array when the spot has no plants', async () => {
    port.findByPlantingSpotId.mockResolvedValue([]);

    const result = await sut.resolvedPlants({
      id: SPOT_ID,
    } as PlantingSpotResponseDto);

    expect(result).toEqual([]);
  });
});
