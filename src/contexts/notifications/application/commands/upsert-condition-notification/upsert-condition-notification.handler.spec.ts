import { EventBus } from '@nestjs/cqrs';

import { NotificationBuilder } from '@contexts/notifications/domain/builders/notification.builder';
import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { UpsertConditionNotificationCommand } from './upsert-condition-notification.command';
import { UpsertConditionNotificationCommandHandler } from './upsert-condition-notification.handler';

const SPACE_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER_1 = '770e8400-e29b-41d4-a716-446655440001';
const USER_2 = '770e8400-e29b-41d4-a716-446655440002';
const REFERENCE_ID = '990e8400-e29b-41d4-a716-446655440010';
const NOTIFICATION_ID = 'aa0e8400-e29b-41d4-a716-446655440011';

const DEDUPE_KEY = NotificationDedupeKeyValueObject.compute(
  NotificationTypeEnum.INVENTORY_LOW_STOCK,
  REFERENCE_ID,
);

function makeOpenViewModel(): NotificationViewModel {
  return new NotificationViewModel({
    id: NOTIFICATION_ID,
    type: NotificationTypeEnum.INVENTORY_LOW_STOCK,
    referenceType: NotificationReferenceTypeEnum.INVENTORY_ITEM,
    referenceId: REFERENCE_ID,
    dedupeKey: DEDUPE_KEY,
    payload: {},
    status: NotificationStatusEnum.UNREAD,
    readAt: null,
    resolvedAt: null,
    userId: USER_1,
    spaceId: SPACE_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('UpsertConditionNotificationCommandHandler', () => {
  let notificationReadRepository: { findOpenByDedupeKey: jest.Mock };
  let notificationWriteRepository: {
    saveMany: jest.Mock;
    findById: jest.Mock;
  };
  let userDirectoryPort: { listActiveMemberUserIds: jest.Mock };
  let spaceContext: { require: jest.Mock };
  let handler: UpsertConditionNotificationCommandHandler;

  beforeEach(() => {
    notificationReadRepository = {
      findOpenByDedupeKey: jest.fn().mockResolvedValue([]),
    };
    notificationWriteRepository = {
      saveMany: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };
    userDirectoryPort = {
      listActiveMemberUserIds: jest.fn().mockResolvedValue([USER_1, USER_2]),
    };
    spaceContext = { require: jest.fn().mockReturnValue(SPACE_ID) };

    const eventBus = { publishAll: jest.fn() } as unknown as EventBus;

    handler = new UpsertConditionNotificationCommandHandler(
      notificationReadRepository as any,
      notificationWriteRepository as any,
      userDirectoryPort as any,
      new NotificationBuilder(),
      spaceContext as unknown as SpaceContext,
      eventBus,
    );
  });

  it('creates one notification per active member when active and none is open', async () => {
    await handler.execute(
      new UpsertConditionNotificationCommand({
        type: NotificationTypeEnum.INVENTORY_LOW_STOCK,
        referenceType: NotificationReferenceTypeEnum.INVENTORY_ITEM,
        referenceId: REFERENCE_ID,
        payload: { itemName: 'Compost' },
        active: true,
      }),
    );

    expect(notificationWriteRepository.saveMany).toHaveBeenCalledTimes(1);
    const saved = notificationWriteRepository.saveMany.mock.calls[0][0];
    expect(saved).toHaveLength(2);
    expect(saved.map((n: any) => n.userId.value).sort()).toEqual(
      [USER_1, USER_2].sort(),
    );
  });

  it('does nothing when active and a notification is already open for that dedupeKey', async () => {
    notificationReadRepository.findOpenByDedupeKey.mockResolvedValue([
      makeOpenViewModel(),
    ]);

    await handler.execute(
      new UpsertConditionNotificationCommand({
        type: NotificationTypeEnum.INVENTORY_LOW_STOCK,
        referenceType: NotificationReferenceTypeEnum.INVENTORY_ITEM,
        referenceId: REFERENCE_ID,
        payload: {},
        active: true,
      }),
    );

    expect(userDirectoryPort.listActiveMemberUserIds).not.toHaveBeenCalled();
    expect(notificationWriteRepository.saveMany).not.toHaveBeenCalled();
  });

  it('resolves every open notification for that dedupeKey when inactive', async () => {
    const openViewModel = makeOpenViewModel();
    notificationReadRepository.findOpenByDedupeKey.mockResolvedValue([
      openViewModel,
    ]);

    const aggregate = new NotificationBuilder()
      .withId(NOTIFICATION_ID)
      .withType(NotificationTypeEnum.INVENTORY_LOW_STOCK)
      .withReferenceType(NotificationReferenceTypeEnum.INVENTORY_ITEM)
      .withReferenceId(REFERENCE_ID)
      .withUserId(USER_1)
      .withSpaceId(SPACE_ID)
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();
    notificationWriteRepository.findById.mockResolvedValue(aggregate);

    await handler.execute(
      new UpsertConditionNotificationCommand({
        type: NotificationTypeEnum.INVENTORY_LOW_STOCK,
        referenceType: NotificationReferenceTypeEnum.INVENTORY_ITEM,
        referenceId: REFERENCE_ID,
        payload: {},
        active: false,
      }),
    );

    expect(aggregate.resolvedAt).not.toBeNull();
    expect(notificationWriteRepository.saveMany).toHaveBeenCalledWith([
      aggregate,
    ]);
  });

  it('does nothing when inactive and nothing is open for that dedupeKey', async () => {
    await handler.execute(
      new UpsertConditionNotificationCommand({
        type: NotificationTypeEnum.INVENTORY_LOW_STOCK,
        referenceType: NotificationReferenceTypeEnum.INVENTORY_ITEM,
        referenceId: REFERENCE_ID,
        payload: {},
        active: false,
      }),
    );

    expect(notificationWriteRepository.findById).not.toHaveBeenCalled();
    expect(notificationWriteRepository.saveMany).not.toHaveBeenCalled();
  });
});
