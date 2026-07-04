import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import { IPlantingSpotReadRepository } from '@contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';

import { PlantingSpotFindByCriteriaQuery } from './planting-spot-find-by-criteria.query';
import { PlantingSpotFindByCriteriaQueryHandler } from './planting-spot-find-by-criteria.handler';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildViewModel = (type: string): PlantingSpotViewModel =>
  new PlantingSpotViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Spot',
    type,
    description: null,
    capacity: null,
    row: null,
    column: null,
    dimensionsWidth: null,
    dimensionsHeight: null,
    dimensionsLength: null,
    soilType: null,
    status: 'active',
    fallowSince: null,
    userId: '550e8400-e29b-41d4-a716-446655440001',
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
  });

const buildCriteria = (filters: Criteria['filters'] = []) =>
  new Criteria(filters, undefined, undefined);

describe('PlantingSpotFindByCriteriaQueryHandler', () => {
  let handler: PlantingSpotFindByCriteriaQueryHandler;
  let readRepository: jest.Mocked<IPlantingSpotReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantingSpotReadRepository>;

    handler = new PlantingSpotFindByCriteriaQueryHandler(readRepository);
  });

  it('delegates to repository and returns paginated result', async () => {
    const vm = buildViewModel('POT');
    const paginated = new PaginatedResult([vm], 1, 1, 20);
    readRepository.findByCriteria.mockResolvedValue(paginated);

    const query = new PlantingSpotFindByCriteriaQuery({
      criteria: buildCriteria(),
    });
    const result = await handler.execute(query);

    expect(result).toBe(paginated);
    expect(readRepository.findByCriteria).toHaveBeenCalledWith(query.criteria);
  });

  it('passes criteria filters to repository', async () => {
    const paginated = new PaginatedResult([], 0, 1, 20);
    readRepository.findByCriteria.mockResolvedValue(paginated);

    const criteria = buildCriteria([
      { field: 'type', operator: FilterOperator.EQUALS, value: 'RAISED_BED' },
    ]);
    const query = new PlantingSpotFindByCriteriaQuery({ criteria });
    await handler.execute(query);

    expect(readRepository.findByCriteria).toHaveBeenCalledWith(criteria);
  });

  it('returns empty paginated result when no spots found', async () => {
    const paginated = new PaginatedResult([], 0, 1, 20);
    readRepository.findByCriteria.mockResolvedValue(paginated);

    const query = new PlantingSpotFindByCriteriaQuery({
      criteria: buildCriteria(),
    });
    const result = await handler.execute(query);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
