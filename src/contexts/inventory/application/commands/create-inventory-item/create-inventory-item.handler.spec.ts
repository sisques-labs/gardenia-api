import { EventBus } from '@nestjs/cqrs';

import { InventoryItemBuilder } from '@contexts/inventory/domain/builders/inventory-item.builder';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { IInventoryItemWriteRepository } from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';
import { CreateInventoryItemCommand } from './create-inventory-item.command';
import { CreateInventoryItemCommandHandler } from './create-inventory-item.handler';

describe('CreateInventoryItemCommandHandler', () => {
  let handler: CreateInventoryItemCommandHandler;
  let mockWriteRepo: jest.Mocked<IInventoryItemWriteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IInventoryItemWriteRepository>;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreateInventoryItemCommandHandler(
      mockWriteRepo,
      new InventoryItemBuilder(),
      mockEventBus,
    );
  });

  it('saves an inventory item and returns its id', async () => {
    const command = new CreateInventoryItemCommand({
      itemType: InventoryItemTypeEnum.SEEDS,
      name: 'Lettuce seeds',
      quantity: 5,
      unit: InventoryUnitEnum.PACKETS,
      userId: '660e8400-e29b-41d4-a716-446655440001',
      spaceId: '770e8400-e29b-41d4-a716-446655440002',
    });

    const result = await handler.execute(command);

    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(36);
  });

  it('throws when name is empty', () => {
    expect(
      () =>
        new CreateInventoryItemCommand({
          itemType: InventoryItemTypeEnum.SEEDS,
          name: '',
          quantity: 5,
          unit: InventoryUnitEnum.PACKETS,
          userId: '660e8400-e29b-41d4-a716-446655440001',
          spaceId: '770e8400-e29b-41d4-a716-446655440002',
        }),
    ).toThrow();
  });

  it('throws when quantity is negative', () => {
    expect(
      () =>
        new CreateInventoryItemCommand({
          itemType: InventoryItemTypeEnum.SEEDS,
          name: 'Lettuce seeds',
          quantity: -1,
          unit: InventoryUnitEnum.PACKETS,
          userId: '660e8400-e29b-41d4-a716-446655440001',
          spaceId: '770e8400-e29b-41d4-a716-446655440002',
        }),
    ).toThrow();
  });

  it('throws when itemType is POT', () => {
    expect(
      () =>
        new CreateInventoryItemCommand({
          itemType: 'POT',
          name: 'Clay pot',
          quantity: 5,
          unit: InventoryUnitEnum.UNITS,
          userId: '660e8400-e29b-41d4-a716-446655440001',
          spaceId: '770e8400-e29b-41d4-a716-446655440002',
        }),
    ).toThrow();
  });
});
