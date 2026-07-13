import { Injectable } from '@nestjs/common';

import { IExpiringItem } from '@contexts/notifications/application/ports/expiring-item.interface';
import { ILowStockItem } from '@contexts/notifications/application/ports/low-stock-item.interface';
import { IDueCareSchedule } from '@contexts/notifications/application/ports/due-care-schedule.interface';
import { IReconciliationPlan } from '@contexts/notifications/application/services/notification-reconciliation/reconciliation-plan.interface';
import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';

/**
 * Pure diff logic, no I/O: given the current set of condition-matching
 * entities (due schedules, low-stock items, expiring items) and the set of
 * currently open notification dedupeKeys, decides what to create and what
 * to resolve. See notifications-module design.md "The core model: condition
 * instances, not events".
 */
@Injectable()
export class NotificationReconciliationService {
  reconcile(input: {
    dueSchedules: IDueCareSchedule[];
    lowStockItems: ILowStockItem[];
    expiringItems: IExpiringItem[];
    openDedupeKeys: string[];
  }): IReconciliationPlan {
    const matched = [
      ...input.dueSchedules.map((s) => ({
        dedupeKey: NotificationDedupeKeyValueObject.compute(
          NotificationTypeEnum.CARE_SCHEDULE_DUE,
          s.scheduleId,
        ),
        type: NotificationTypeEnum.CARE_SCHEDULE_DUE,
        referenceType: NotificationReferenceTypeEnum.CARE_SCHEDULE,
        referenceId: s.scheduleId,
        payload: {
          plantId: s.plantId,
          activityType: s.activityType,
          nextDueAt: s.nextDueAt,
        },
      })),
      ...input.lowStockItems.map((item) => ({
        dedupeKey: NotificationDedupeKeyValueObject.compute(
          NotificationTypeEnum.INVENTORY_LOW_STOCK,
          item.itemId,
        ),
        type: NotificationTypeEnum.INVENTORY_LOW_STOCK,
        referenceType: NotificationReferenceTypeEnum.INVENTORY_ITEM,
        referenceId: item.itemId,
        payload: {
          itemName: item.name,
          itemType: item.itemType,
          quantity: item.quantity,
          unit: item.unit,
          lowStockThreshold: item.lowStockThreshold,
        },
      })),
      ...input.expiringItems.map((item) => ({
        dedupeKey: NotificationDedupeKeyValueObject.compute(
          NotificationTypeEnum.INVENTORY_EXPIRING_SOON,
          item.itemId,
        ),
        type: NotificationTypeEnum.INVENTORY_EXPIRING_SOON,
        referenceType: NotificationReferenceTypeEnum.INVENTORY_ITEM,
        referenceId: item.itemId,
        payload: {
          itemName: item.name,
          itemType: item.itemType,
          expiresAt: item.expiresAt,
        },
      })),
    ];

    const openKeys = new Set(input.openDedupeKeys);
    const matchedKeys = new Set(matched.map((m) => m.dedupeKey));

    const toCreate = matched.filter((m) => !openKeys.has(m.dedupeKey));
    const toResolveDedupeKeys = input.openDedupeKeys.filter(
      (key) => !matchedKeys.has(key),
    );

    return { toCreate, toResolveDedupeKeys };
  }
}
