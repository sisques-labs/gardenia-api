import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemBuilder } from './inventory-item.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const base = (): InventoryItemBuilder =>
  new InventoryItemBuilder()
    .withId(ID)
    .withItemType(InventoryItemTypeEnum.FERTILIZER)
    .withName('Universal fertilizer')
    .withQuantity(10)
    .withUnit(InventoryUnitEnum.KG)
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('InventoryItemBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with required fields and null optionals', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.itemType.value).toBe(InventoryItemTypeEnum.FERTILIZER);
      expect(aggregate.name.value).toBe('Universal fertilizer');
      expect(aggregate.quantity.value).toBe(10);
      expect(aggregate.unit.value).toBe(InventoryUnitEnum.KG);
      expect(aggregate.brand).toBeNull();
      expect(aggregate.notes).toBeNull();
      expect(aggregate.lowStockThreshold).toBeNull();
      expect(aggregate.acquiredAt).toBeNull();
      expect(aggregate.expiresAt).toBeNull();
    });

    it('wraps optional fields when provided', () => {
      const acquiredAt = new Date('2026-01-05');
      const expiresAt = new Date('2027-01-05');
      const aggregate = base()
        .withBrand('Compo')
        .withNotes('Keep dry')
        .withLowStockThreshold(2)
        .withAcquiredAt(acquiredAt)
        .withExpiresAt(expiresAt)
        .build();

      expect(aggregate.brand?.value).toBe('Compo');
      expect(aggregate.notes?.value).toBe('Keep dry');
      expect(aggregate.lowStockThreshold?.value).toBe(2);
      expect(aggregate.acquiredAt?.value).toBe(acquiredAt);
      expect(aggregate.expiresAt?.value).toBe(expiresAt);
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive values', () => {
      const vm = base().withBrand('Compo').buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.itemType).toBe(InventoryItemTypeEnum.FERTILIZER);
      expect(vm.name).toBe('Universal fertilizer');
      expect(vm.brand).toBe('Compo');
      expect(vm.quantity).toBe(10);
    });
  });

  describe('validate()', () => {
    it('throws when itemType is missing', () => {
      expect(() =>
        base()
          .withItemType(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when name is missing', () => {
      expect(() =>
        base()
          .withName(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when unit is missing', () => {
      expect(() =>
        base()
          .withUnit(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
