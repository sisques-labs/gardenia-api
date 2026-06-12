import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { IHarvestReadRepository } from '@contexts/harvests/domain/repositories/read/harvest-read.repository';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
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

  it('returns paginated results from repository', async () => {
    const vm = buildViewModel();
    const paginated = new PaginatedResult([vm], 1, 1, 20);
    mockReadRepo.findByCriteria.mockResolvedValue(paginated);

    const query = new HarvestFindByCriteriaQuery({
      cropType: 'Tomate',
      page: 1,
      limit: 20,
    });

    const result = await handler.execute(query);

    expect(result).toBe(paginated);
    expect(mockReadRepo.findByCriteria).toHaveBeenCalledWith({
      cropType: 'Tomate',
      page: 1,
      limit: 20,
    });
  });

  it('passes unit filter to repository', async () => {
    const paginated = new PaginatedResult([], 0, 1, 20);
    mockReadRepo.findByCriteria.mockResolvedValue(paginated);

    const query = new HarvestFindByCriteriaQuery({ unit: HarvestUnitEnum.KG });

    await handler.execute(query);

    expect(mockReadRepo.findByCriteria).toHaveBeenCalledWith({
      unit: HarvestUnitEnum.KG,
    });
  });

  it('passes date range filter to repository', async () => {
    const paginated = new PaginatedResult([], 0, 1, 20);
    mockReadRepo.findByCriteria.mockResolvedValue(paginated);

    const dateFrom = new Date('2026-01-01');
    const dateTo = new Date('2026-12-31');
    const query = new HarvestFindByCriteriaQuery({ dateFrom, dateTo });

    await handler.execute(query);

    expect(mockReadRepo.findByCriteria).toHaveBeenCalledWith({
      dateFrom,
      dateTo,
    });
  });

  it('returns empty result when no harvests match', async () => {
    const paginated = new PaginatedResult([], 0, 1, 20);
    mockReadRepo.findByCriteria.mockResolvedValue(paginated);

    const query = new HarvestFindByCriteriaQuery({});

    const result = await handler.execute(query);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
