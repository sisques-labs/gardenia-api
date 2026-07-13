import { NotificationsUnreadCountQuery } from './notifications-unread-count.query';
import { NotificationsUnreadCountQueryHandler } from './notifications-unread-count.handler';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('NotificationsUnreadCountQueryHandler', () => {
  it('delegates to the read repository countUnread with the query userId', async () => {
    const readRepository = { countUnread: jest.fn().mockResolvedValue(3) };
    const handler = new NotificationsUnreadCountQueryHandler(
      readRepository as any,
    );

    const result = await handler.execute(
      new NotificationsUnreadCountQuery(USER_ID),
    );

    expect(readRepository.countUnread).toHaveBeenCalledWith(USER_ID);
    expect(result).toBe(3);
  });

  it('returns 0 when there are no unread notifications', async () => {
    const readRepository = { countUnread: jest.fn().mockResolvedValue(0) };
    const handler = new NotificationsUnreadCountQueryHandler(
      readRepository as any,
    );

    const result = await handler.execute(
      new NotificationsUnreadCountQuery(USER_ID),
    );

    expect(result).toBe(0);
  });
});
