import { randomUUID } from 'crypto';

import { InventoryItemBuilder } from '../../../src/contexts/inventory/domain/builders/inventory-item.builder';
import { InventoryItemTypeEnum } from '../../../src/contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '../../../src/contexts/inventory/domain/enums/inventory-unit.enum';
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

describe('InventoryItemTypeOrmWriteRepository (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: IInventoryItemWriteRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [InventoryModule] });
    writeRepo = ctx.module.get(INVENTORY_ITEM_WRITE_REPOSITORY);
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

  it('round-trips nullable optional fields', async () => {
    let id: string;
    await ctx.spaceContext.run(spaceAId, async () => {
      const item = new InventoryItemBuilder()
        .withId(randomUUID())
        .withItemType(InventoryItemTypeEnum.FERTILIZER)
        .withName('Tomato fertilizer')
        .withBrand('Batlle')
        .withNotes('In the shed')
        .withQuantity(2.5)
        .withUnit(InventoryUnitEnum.L)
        .withLowStockThreshold(1.5)
        .withAcquiredAt(new Date('2026-03-01'))
        .withExpiresAt(new Date('2027-03-01'))
        .withUserId(userAId)
        .withSpaceId(PLACEHOLDER_SPACE_ID)
        .withCreatedAt(NOW)
        .withUpdatedAt(NOW)
        .build();
      await writeRepo.save(item);
      id = item.id.value;
    });

    await ctx.spaceContext.run(spaceAId, async () => {
      const found = await writeRepo.findById(id);
      expect(found).not.toBeNull();
      const p = found!.toPrimitives();
      expect(p.brand).toBe('Batlle');
      expect(p.notes).toBe('In the shed');
      expect(p.lowStockThreshold).toBe(1.5);
      expect(p.quantity).toBe(2.5);
    });
  });

  it('does not find an item created in another space', async () => {
    let id: string;
    await ctx.spaceContext.run(spaceAId, async () => {
      const item = new InventoryItemBuilder()
        .withId(randomUUID())
        .withItemType(InventoryItemTypeEnum.SEEDS)
        .withName('Item in A')
        .withBrand(null)
        .withNotes(null)
        .withQuantity(5)
        .withUnit(InventoryUnitEnum.PACKETS)
        .withLowStockThreshold(null)
        .withAcquiredAt(null)
        .withExpiresAt(null)
        .withUserId(userAId)
        .withSpaceId(PLACEHOLDER_SPACE_ID)
        .withCreatedAt(NOW)
        .withUpdatedAt(NOW)
        .build();
      await writeRepo.save(item);
      id = item.id.value;
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const found = await writeRepo.findById(id);
      expect(found).toBeNull();
    });
  });
});
