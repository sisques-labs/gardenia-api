import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { IHarvestReadRepository } from '@contexts/harvests/domain/repositories/read/harvest-read.repository';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestFindByCriteriaQuery } from './harvest-find-by-criteria.query';
import { HarvestFindByCriteriaQueryHandler } from './harvest-find-by-criteria.handler';

function buildViewModel(): HarvestViewModel {
  return new HarvestViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    cropType: 'Tomate Cherry',
    quantity: 2.5,
    unit: HarvestUnitEnum.KG,
    harvestedAt: new Date('2026-06-01'),
    userId: '660e8400-e29b-41d4-a716-446655440001',
    spaceId: '770e8400-e29b-41d4-a716-446655440002',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('HarvestFindByCriteriaQueryHandler', () => {
  let handler: HarvestFindByCriteriaQueryHandler;
  let mockReadRepo: jest.Mocked<IHarvestReadRepository>;

  beforeEach(() => {
    mockReadRepo = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IHarvestReadRepository>;

    handler = new HarvestFindByCriteriaQueryHandler(mockReadRepo);
  });

  it('delegates criteria to repository and returns result', async () => {
    const vm = buildViewModel();
    const paginated = new PaginatedResult([vm], 1, 1, 20);
    mockReadRepo.findByCriteria.mockResolvedValue(paginated);

    const criteria = new Criteria(undefined, undefined, undefined);
    const query = new HarvestFindByCriteriaQuery(criteria);

    const result = await handler.execute(query);

    expect(result).toBe(paginated);
    expect(mockReadRepo.findByCriteria).toHaveBeenCalledWith(criteria);
  });

  it('returns empty result when no harvests match', async () => {
    const paginated = new PaginatedResult([], 0, 1, 20);
    mockReadRepo.findByCriteria.mockResolvedValue(paginated);

    const query = new HarvestFindByCriteriaQuery(
      new Criteria(undefined, undefined, undefined),
    );

    const result = await handler.execute(query);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
