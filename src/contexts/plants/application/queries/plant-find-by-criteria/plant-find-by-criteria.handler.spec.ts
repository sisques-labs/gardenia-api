import { IPlantReadRepository } from '@contexts/plants/domain/repositories/read/plant-read.repository';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { PlantFindByCriteriaQuery } from './plant-find-by-criteria.query';
import { PlantFindByCriteriaQueryHandler } from './plant-find-by-criteria.handler';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildViewModel = (): PlantViewModel =>
  new PlantViewModel({
    id: PLANT_ID,
    name: 'Rose',
    plantSpeciesId: null,
    imageUrl: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    qrId: null,
    plantingSpotId: null,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('PlantFindByCriteriaQueryHandler', () => {
  let handler: PlantFindByCriteriaQueryHandler;
  let plantReadRepository: jest.Mocked<IPlantReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    plantReadRepository = {
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IPlantReadRepository>;

    handler = new PlantFindByCriteriaQueryHandler(plantReadRepository);
  });

  it('returns paginated results without enriching species or qr', async () => {
    const vm = buildViewModel();
    const paginated = new PaginatedResult([vm], 1, 1, 10);
    plantReadRepository.findByCriteria.mockResolvedValueOnce(paginated);

    const query = new PlantFindByCriteriaQuery({
      criteria: new Criteria([], [], { page: 1, perPage: 10 }),
    });
    const result = await handler.execute(query);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toBe(vm);
    expect(result.total).toBe(1);
    expect(plantReadRepository.findByCriteria).toHaveBeenCalledWith(
      query.criteria,
    );
  });

  it('returns empty paginated results when repository returns no items', async () => {
    const paginated = new PaginatedResult([], 0, 1, 10);
    plantReadRepository.findByCriteria.mockResolvedValueOnce(paginated);

    const query = new PlantFindByCriteriaQuery({
      criteria: new Criteria([], [], { page: 1, perPage: 10 }),
    });
    const result = await handler.execute(query);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
