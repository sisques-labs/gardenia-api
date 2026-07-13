import { EventBus } from '@nestjs/cqrs';

import { NotificationReconciliationService } from '@contexts/notifications/application/services/notification-reconciliation/notification-reconciliation.service';
import { NotificationBuilder } from '@contexts/notifications/domain/builders/notification.builder';
import { ReconcileSpaceNotificationsCommand } from './reconcile-space-notifications.command';
import { ReconcileSpaceNotificationsCommandHandler } from './reconcile-space-notifications.handler';

const SPACE_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER_1 = '770e8400-e29b-41d4-a716-446655440001';
const USER_2 = '770e8400-e29b-41d4-a716-446655440002';

describe('ReconcileSpaceNotificationsCommandHandler', () => {
  let careScheduleAlertsPort: { findDueWithin: jest.Mock };
  let inventoryAlertsPort: {
    findLowStock: jest.Mock;
    findExpiringWithin: jest.Mock;
  };
  let userDirectoryPort: { listActiveMemberUserIds: jest.Mock };
  let notificationDispatcherPort: { dispatch: jest.Mock };
  let notificationReadRepository: {
    findOpenGroupedByDedupeKey: jest.Mock;
  };
  let notificationWriteRepository: {
    saveMany: jest.Mock;
    findById: jest.Mock;
  };
  let spaceContext: { require: jest.Mock };
  let handler: ReconcileSpaceNotificationsCommandHandler;

  beforeEach(() => {
    careScheduleAlertsPort = { findDueWithin: jest.fn().mockResolvedValue([]) };
    inventoryAlertsPort = {
      findLowStock: jest.fn().mockResolvedValue([]),
      findExpiringWithin: jest.fn().mockResolvedValue([]),
    };
    userDirectoryPort = {
      listActiveMemberUserIds: jest.fn().mockResolvedValue([USER_1, USER_2]),
    };
    notificationDispatcherPort = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };
    notificationReadRepository = {
      findOpenGroupedByDedupeKey: jest.fn().mockResolvedValue(new Map()),
    };
    notificationWriteRepository = {
      saveMany: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };
    spaceContext = { require: jest.fn().mockReturnValue(SPACE_ID) };

    const eventBus = { publishAll: jest.fn() } as unknown as EventBus;

    handler = new ReconcileSpaceNotificationsCommandHandler(
      careScheduleAlertsPort as any,
      inventoryAlertsPort as any,
      userDirectoryPort as any,
      notificationDispatcherPort as any,
      notificationReadRepository as any,
      notificationWriteRepository as any,
      new NotificationReconciliationService(),
      new NotificationBuilder(),
      spaceContext as any,
      eventBus,
    );
  });

  it('fans out one notification per active member for each newly matched condition', async () => {
    careScheduleAlertsPort.findDueWithin.mockResolvedValue([
      {
        scheduleId: '990e8400-e29b-41d4-a716-446655440010',
        plantId: 'aa0e8400-e29b-41d4-a716-446655440011',
        activityType: 'WATERING',
        nextDueAt: new Date(),
      },
    ]);

    await handler.execute(
      new ReconcileSpaceNotificationsCommand({
        careScheduleDueWindowHours: 24,
        inventoryExpiringWindowDays: 7,
      }),
    );

    expect(notificationWriteRepository.saveMany).toHaveBeenCalledTimes(1);
    const saved = notificationWriteRepository.saveMany.mock.calls[0][0];
    expect(saved).toHaveLength(2); // one per member
    expect(saved.map((n: any) => n.userId.value).sort()).toEqual(
      [USER_1, USER_2].sort(),
    );
    expect(notificationDispatcherPort.dispatch).toHaveBeenCalledTimes(2);
  });

  it('does nothing when there are no matched conditions and no open notifications', async () => {
    await handler.execute(
      new ReconcileSpaceNotificationsCommand({
        careScheduleDueWindowHours: 24,
        inventoryExpiringWindowDays: 7,
      }),
    );

    expect(notificationWriteRepository.saveMany).toHaveBeenCalledWith([]);
    expect(notificationDispatcherPort.dispatch).not.toHaveBeenCalled();
  });
});
