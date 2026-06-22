import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { HarvestGraphQLMapper } from './harvest.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const buildViewModel = (): HarvestViewModel =>
  new HarvestViewModel({
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

describe('HarvestGraphQLMapper', () => {
  let mapper: HarvestGraphQLMapper;

  beforeEach(() => {
    mapper = new HarvestGraphQLMapper();
  });

  describe('toResponseDto()', () => {
    it('maps every field from the view model', () => {
      const dto = mapper.toResponseDto(buildViewModel());

      expect(dto.id).toBe(ID);
      expect(dto.cropType).toBe('Tomato');
      expect(dto.quantity).toBe(2.5);
      expect(dto.unit).toBe(HarvestUnitEnum.KG);
      expect(dto.harvestedAt).toBe(NOW);
      expect(dto.userId).toBe(USER_ID);
      expect(dto.spaceId).toBe(SPACE_ID);
    });
  });

  describe('toPaginatedResponseDto()', () => {
    it('maps items and pagination metadata', () => {
      const paginated = new PaginatedResult([buildViewModel()], 1, 1, 10);

      const dto = mapper.toPaginatedResponseDto(paginated);

      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].id).toBe(ID);
      expect(dto.total).toBe(1);
      expect(dto.page).toBe(1);
      expect(dto.perPage).toBe(10);
    });

    it('maps an empty page', () => {
      const dto = mapper.toPaginatedResponseDto(
        new PaginatedResult([], 0, 1, 10),
      );

      expect(dto.items).toHaveLength(0);
      expect(dto.total).toBe(0);
    });
  });
});
