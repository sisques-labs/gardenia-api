import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { NotificationFindByCriteriaQuery } from './notification-find-by-criteria.query';
import { NotificationFindByCriteriaQueryHandler } from './notification-find-by-criteria.handler';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('NotificationFindByCriteriaQueryHandler', () => {
  it('delegates to the read repository findByCriteria with userId and criteria', async () => {
    const criteria = new Criteria();
    const result = new PaginatedResult([], 0, 1, 20);
    const readRepository = {
      findByCriteria: jest.fn().mockResolvedValue(result),
    };
    const handler = new NotificationFindByCriteriaQueryHandler(
      readRepository as any,
    );

    const output = await handler.execute(
      new NotificationFindByCriteriaQuery(USER_ID, criteria),
    );

    expect(readRepository.findByCriteria).toHaveBeenCalledWith(
      USER_ID,
      criteria,
    );
    expect(output).toBe(result);
  });

  it('returns an empty result when there are no matching notifications', async () => {
    const criteria = new Criteria();
    const empty = new PaginatedResult([], 0, 1, 20);
    const readRepository = {
      findByCriteria: jest.fn().mockResolvedValue(empty),
    };
    const handler = new NotificationFindByCriteriaQueryHandler(
      readRepository as any,
    );

    const output = await handler.execute(
      new NotificationFindByCriteriaQuery(USER_ID, criteria),
    );

    expect(output.items).toEqual([]);
  });
});
