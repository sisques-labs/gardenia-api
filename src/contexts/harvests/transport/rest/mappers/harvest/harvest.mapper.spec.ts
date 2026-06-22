import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { HarvestRestMapper } from './harvest.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2026-01-01T00:00:00.000Z');

describe('HarvestRestMapper', () => {
  let mapper: HarvestRestMapper;

  beforeEach(() => {
    mapper = new HarvestRestMapper();
  });

  it('maps every field from the view model', () => {
    const vm = new HarvestViewModel({
      id: ID,
      cropType: 'Tomato',
      quantity: 2.5,
      unit: HarvestUnitEnum.KG,
      harvestedAt: NOW,
      userId: USER_ID,
      spaceId: SPACE_ID,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const dto = mapper.toResponse(vm);

    expect(dto.id).toBe(ID);
    expect(dto.cropType).toBe('Tomato');
    expect(dto.quantity).toBe(2.5);
    expect(dto.unit).toBe(HarvestUnitEnum.KG);
    expect(dto.harvestedAt).toBe(NOW);
    expect(dto.userId).toBe(USER_ID);
    expect(dto.spaceId).toBe(SPACE_ID);
  });
});
