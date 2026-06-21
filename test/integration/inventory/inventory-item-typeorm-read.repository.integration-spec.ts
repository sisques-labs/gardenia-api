import { randomUUID } from 'crypto';

import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import { InventoryItemBuilder } from '../../../src/contexts/inventory/domain/builders/inventory-item.builder';
import { InventoryItemTypeEnum } from '../../../src/contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '../../../src/contexts/inventory/domain/enums/inventory-unit.enum';
import {
  IInventoryItemReadRepository,
  INVENTORY_ITEM_READ_REPOSITORY,
} from '../../../src/contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import {
  IInventoryItemWriteRepository,
  INVENTORY_ITEM_WRITE_REPOSITORY,
} from '../../../src/contexts/inventory/domain/repositories/write/inventory-item-write.repository';
import { InventoryModule } from '../../../src/contexts/inventory/inventory.module';
import { truncateAll } from '../../helpers/db-reset';
import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { seedSpaceWithUser } from '../../helpers/tenant-seed';

const NOW = new Date('2026-06-01T00:00:00.000Z');
const PLACEHOLDER_SPACE_ID = randomUUID();

function buildItem(
  name: string,
  userId: string,
  overrides: Partial<{
    itemType: InventoryItemTypeEnum;
    quantity: number;
    unit: InventoryUnitEnum;
    lowStockThreshold: number | null;
    expiresAt: Date | null;
  }> = {},
) {
  return new InventoryItemBuilder()
    .withId(randomUUID())
    .withItemType(overrides.itemType ?? InventoryItemTypeEnum.SEEDS)
    .withName(name)
    .withBrand(null)
    .withNotes(null)
    .withQuantity(overrides.quantity ?? 5)
    .withUnit(overrides.unit ?? InventoryUnitEnum.PACKETS)
    .withLowStockThreshold(overrides.lowStockThreshold ?? null)
    .withAcquiredAt(null)
    .withExpiresAt(overrides.expiresAt ?? null)
    .withUserId(userId)
    .withSpaceId(PLACEHOLDER_SPACE_ID)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('InventoryItemTypeOrmReadRepository (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: IInventoryItemWriteRepository;
  let readRepo: IInventoryItemReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [InventoryModule] });
    writeRepo = ctx.module.get(INVENTORY_ITEM_WRITE_REPOSITORY);
    readRepo = ctx.module.get(INVENTORY_ITEM_READ_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    await seedSpaceWithUser(ctx.dataSource, spaceAId, userAId, {
      spaceName: 'Space A',
      username: 'owner_a',
    });
    await seedSpaceWithUser(ctx.dataSource, spaceBId, userBId, {
      spaceName: 'Space B',
      username: 'owner_b',
    });
  });

  it('round-trips a decimal quantity', async () => {
    let id: string;
    await ctx.spaceContext.run(spaceAId, async () => {
      const item = buildItem('Lettuce seeds', userAId, { quantity: 0.125 });
      await writeRepo.save(item);
      id = item.id.value;
    });

    await ctx.spaceContext.run(spaceAId, async () => {
      const vm = await readRepo.findById(id);
      expect(vm!.quantity).toBe(0.125);
    });
  });

  it('enforces tenant isolation on findById', async () => {
    let id: string;
    await ctx.spaceContext.run(spaceAId, async () => {
      const item = buildItem('Item in A', userAId);
      await writeRepo.save(item);
      id = item.id.value;
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const vm = await readRepo.findById(id);
      expect(vm).toBeNull();
    });
  });

  it('filters by itemType', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(
        buildItem('Seeds', userAId, { itemType: InventoryItemTypeEnum.SEEDS }),
      );
      await writeRepo.save(
        buildItem('Fertilizer', userAId, {
          itemType: InventoryItemTypeEnum.FERTILIZER,
          unit: InventoryUnitEnum.L,
        }),
      );

      const result = await readRepo.findByCriteria(
        new Criteria(
          [
            {
              field: 'item_type',
              operator: FilterOperator.EQUALS,
              value: InventoryItemTypeEnum.SEEDS,
            },
          ],
          [],
          { page: 1, perPage: 10 },
        ),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].itemType).toBe(InventoryItemTypeEnum.SEEDS);
    });
  });

  it('filters by name (case-insensitive)', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(buildItem('Lettuce seeds', userAId));
      await writeRepo.save(buildItem('Tomato fertilizer', userAId));

      const result = await readRepo.findByCriteria(
        new Criteria(
          [{ field: 'name', operator: FilterOperator.LIKE, value: 'lettuce' }],
          [],
          { page: 1, perPage: 10 },
        ),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Lettuce seeds');
    });
  });

  it('filters by lowStock (threshold semantics)', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(
        buildItem('Low', userAId, { quantity: 1, lowStockThreshold: 3 }),
      );
      await writeRepo.save(
        buildItem('Plenty', userAId, { quantity: 10, lowStockThreshold: 3 }),
      );
      await writeRepo.save(
        buildItem('NoThreshold', userAId, {
          quantity: 0,
          lowStockThreshold: null,
        }),
      );

      const result = await readRepo.findByCriteria(
        new Criteria(
          [
            {
              field: 'low_stock',
              operator: FilterOperator.EQUALS,
              value: true,
            },
          ],
          [],
          { page: 1, perPage: 10 },
        ),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Low');
    });
  });

  it('filters by expiringBefore', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(
        buildItem('Soon', userAId, { expiresAt: new Date('2026-07-01') }),
      );
      await writeRepo.save(
        buildItem('Later', userAId, { expiresAt: new Date('2026-12-01') }),
      );
      await writeRepo.save(buildItem('NoExpiry', userAId, { expiresAt: null }));

      const result = await readRepo.findByCriteria(
        new Criteria(
          [
            {
              field: 'expires_at',
              operator: FilterOperator.LESS_THAN_OR_EQUAL,
              value: new Date('2026-08-01'),
            },
          ],
          [],
          { page: 1, perPage: 10 },
        ),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Soon');
    });
  });

  it('scopes findByCriteria to the active space', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(buildItem('Item A', userAId));
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const result = await readRepo.findByCriteria(
        new Criteria([], [], { page: 1, perPage: 10 }),
      );
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
