import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestNotFoundException } from '@contexts/harvests/domain/exceptions/harvest-not-found.exception';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { AssertHarvestViewModelExistsService } from '@contexts/harvests/application/services/read/assert-harvest-view-model-exists/assert-harvest-view-model-exists.service';
import { HarvestFindByIdQuery } from './harvest-find-by-id.query';
import { HarvestFindByIdQueryHandler } from './harvest-find-by-id.handler';

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

describe('HarvestFindByIdQueryHandler', () => {
  let handler: HarvestFindByIdQueryHandler;
  let mockAssertService: jest.Mocked<AssertHarvestViewModelExistsService>;

  beforeEach(() => {
    mockAssertService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertHarvestViewModelExistsService>;

    handler = new HarvestFindByIdQueryHandler(mockAssertService);
  });

  it('returns the ViewModel when harvest exists', async () => {
    const vm = buildViewModel();
    mockAssertService.execute.mockResolvedValue(vm);

    const query = new HarvestFindByIdQuery({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });

    const result = await handler.execute(query);

    expect(result).toBe(vm);
    expect(mockAssertService.execute).toHaveBeenCalledTimes(1);
  });

  it('throws HarvestNotFoundException when harvest not found', async () => {
    mockAssertService.execute.mockRejectedValue(
      new HarvestNotFoundException('550e8400-e29b-41d4-a716-446655440000'),
    );

    const query = new HarvestFindByIdQuery({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });

    await expect(handler.execute(query)).rejects.toThrow(
      HarvestNotFoundException,
    );
  });
});
