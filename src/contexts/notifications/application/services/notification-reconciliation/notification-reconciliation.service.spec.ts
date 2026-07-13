import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { NotificationReconciliationService } from './notification-reconciliation.service';

describe('NotificationReconciliationService', () => {
  const service = new NotificationReconciliationService();

  it('returns nothing to do when there are no conditions and no open notifications', () => {
    const plan = service.reconcile({
      dueSchedules: [],
      lowStockItems: [],
      expiringItems: [],
      openDedupeKeys: [],
    });
    expect(plan.toCreate).toHaveLength(0);
    expect(plan.toResolveDedupeKeys).toHaveLength(0);
  });

  it('creates one entry per new matched condition when no open notification exists for it', () => {
    const plan = service.reconcile({
      dueSchedules: [
        {
          scheduleId: 'sched-1',
          plantId: 'plant-1',
          activityType: 'WATERING',
          nextDueAt: new Date('2026-07-14'),
        },
      ],
      lowStockItems: [
        {
          itemId: 'item-1',
          name: 'Seeds',
          itemType: 'SEEDS',
          quantity: 1,
          unit: 'PACKETS',
          lowStockThreshold: 5,
        },
      ],
      expiringItems: [
        {
          itemId: 'item-2',
          name: 'Fertilizer',
          itemType: 'FERTILIZER',
          expiresAt: new Date('2026-07-20'),
        },
      ],
      openDedupeKeys: [],
    });

    expect(plan.toCreate).toHaveLength(3);
    expect(plan.toCreate.map((c) => c.type).sort()).toEqual(
      [
        NotificationTypeEnum.CARE_SCHEDULE_DUE,
        NotificationTypeEnum.INVENTORY_EXPIRING_SOON,
        NotificationTypeEnum.INVENTORY_LOW_STOCK,
      ].sort(),
    );
    expect(plan.toResolveDedupeKeys).toHaveLength(0);
  });

  it('is a no-op when a condition still matches and an open notification already exists', () => {
    const dedupeKey = NotificationDedupeKeyValueObject.compute(
      NotificationTypeEnum.CARE_SCHEDULE_DUE,
      'sched-1',
    );
    const plan = service.reconcile({
      dueSchedules: [
        {
          scheduleId: 'sched-1',
          plantId: 'plant-1',
          activityType: 'WATERING',
          nextDueAt: new Date('2026-07-14'),
        },
      ],
      lowStockItems: [],
      expiringItems: [],
      openDedupeKeys: [dedupeKey],
    });

    expect(plan.toCreate).toHaveLength(0);
    expect(plan.toResolveDedupeKeys).toHaveLength(0);
  });

  it('resolves an open notification whose condition no longer matches', () => {
    const dedupeKey = NotificationDedupeKeyValueObject.compute(
      NotificationTypeEnum.INVENTORY_LOW_STOCK,
      'item-1',
    );
    const plan = service.reconcile({
      dueSchedules: [],
      lowStockItems: [], // restocked above threshold, no longer matches
      expiringItems: [],
      openDedupeKeys: [dedupeKey],
    });

    expect(plan.toCreate).toHaveLength(0);
    expect(plan.toResolveDedupeKeys).toEqual([dedupeKey]);
  });

  it('handles a mixed pass: creates new, leaves unchanged, and resolves cleared conditions in one call', () => {
    const stillOpenKey = NotificationDedupeKeyValueObject.compute(
      NotificationTypeEnum.CARE_SCHEDULE_DUE,
      'sched-still-due',
    );
    const clearedKey = NotificationDedupeKeyValueObject.compute(
      NotificationTypeEnum.INVENTORY_LOW_STOCK,
      'item-restocked',
    );

    const plan = service.reconcile({
      dueSchedules: [
        {
          scheduleId: 'sched-still-due',
          plantId: 'plant-1',
          activityType: 'WATERING',
          nextDueAt: new Date('2026-07-14'),
        },
        {
          scheduleId: 'sched-new',
          plantId: 'plant-2',
          activityType: 'FERTILIZING',
          nextDueAt: new Date('2026-07-15'),
        },
      ],
      lowStockItems: [],
      expiringItems: [],
      openDedupeKeys: [stillOpenKey, clearedKey],
    });

    expect(plan.toCreate).toHaveLength(1);
    expect(plan.toCreate[0].referenceId).toBe('sched-new');
    expect(plan.toResolveDedupeKeys).toEqual([clearedKey]);
  });

  it('a condition re-opening after resolution produces a new create entry (new row, same dedupeKey)', () => {
    const dedupeKey = NotificationDedupeKeyValueObject.compute(
      NotificationTypeEnum.INVENTORY_LOW_STOCK,
      'item-1',
    );

    // Cycle 1: item drops low, no open notification yet -> create.
    const cycle1 = service.reconcile({
      dueSchedules: [],
      lowStockItems: [
        {
          itemId: 'item-1',
          name: 'Seeds',
          itemType: 'SEEDS',
          quantity: 1,
          unit: 'PACKETS',
          lowStockThreshold: 5,
        },
      ],
      expiringItems: [],
      openDedupeKeys: [],
    });
    expect(cycle1.toCreate).toHaveLength(1);

    // Cycle 2: restocked -> resolve the open one.
    const cycle2 = service.reconcile({
      dueSchedules: [],
      lowStockItems: [],
      expiringItems: [],
      openDedupeKeys: [dedupeKey],
    });
    expect(cycle2.toResolveDedupeKeys).toEqual([dedupeKey]);

    // Cycle 3: drops low again, no open notification (it was resolved) -> create again.
    const cycle3 = service.reconcile({
      dueSchedules: [],
      lowStockItems: [
        {
          itemId: 'item-1',
          name: 'Seeds',
          itemType: 'SEEDS',
          quantity: 0,
          unit: 'PACKETS',
          lowStockThreshold: 5,
        },
      ],
      expiringItems: [],
      openDedupeKeys: [],
    });
    expect(cycle3.toCreate).toHaveLength(1);
    expect(cycle3.toCreate[0].dedupeKey).toBe(dedupeKey);
  });
});
