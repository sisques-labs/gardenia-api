import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { InventoryItemGraphQLMapper } from './inventory-item.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const buildViewModel = (
  overrides: Partial<InventoryItemViewModel> = {},
): InventoryItemViewModel =>
  new InventoryItemViewModel({
    id: ID,
    itemType: InventoryItemTypeEnum.FERTILIZER,
    name: 'Universal fertilizer',
    brand: 'Compo',
    notes: 'Keep dry',
    quantity: 10,
    unit: InventoryUnitEnum.KG,
    lowStockThreshold: 2,
    acquiredAt: NOW,
    expiresAt: NOW,
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

describe('InventoryItemGraphQLMapper', () => {
  let mapper: InventoryItemGraphQLMapper;

  beforeEach(() => {
    mapper = new InventoryItemGraphQLMapper();
  });

  it('maps every field from the view model', () => {
    const dto = mapper.toResponseDto(buildViewModel());

    expect(dto.id).toBe(ID);
    expect(dto.itemType).toBe(InventoryItemTypeEnum.FERTILIZER);
    expect(dto.name).toBe('Universal fertilizer');
    expect(dto.brand).toBe('Compo');
    expect(dto.quantity).toBe(10);
    expect(dto.lowStockThreshold).toBe(2);
  });

  it('maps null optional fields', () => {
    const dto = mapper.toResponseDto(
      buildViewModel({ brand: null, notes: null, lowStockThreshold: null }),
    );

    expect(dto.brand).toBeNull();
    expect(dto.notes).toBeNull();
    expect(dto.lowStockThreshold).toBeNull();
  });

  describe('toPaginatedResponseDto()', () => {
    it('maps items and pagination metadata', () => {
      const dto = mapper.toPaginatedResponseDto(
        new PaginatedResult([buildViewModel()], 1, 1, 10),
      );

      expect(dto.items).toHaveLength(1);
      expect(dto.total).toBe(1);
      expect(dto.perPage).toBe(10);
    });
  });
});
