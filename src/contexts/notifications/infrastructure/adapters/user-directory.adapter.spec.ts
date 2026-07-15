import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { SpaceContext } from '@shared/space-context/space-context.service';
import { UserDirectoryAdapter } from './user-directory.adapter';

const SPACE_A = '880e8400-e29b-41d4-a716-446655440003';
const SPACE_B = '880e8400-e29b-41d4-a716-446655440004';

describe('UserDirectoryAdapter', () => {
  let mockQueryBus: jest.Mocked<QueryBus>;
  let mockSpaceContext: jest.Mocked<SpaceContext>;
  let adapter: UserDirectoryAdapter;

  beforeEach(() => {
    mockQueryBus = {
      execute: jest
        .fn()
        .mockResolvedValue(
          new PaginatedResult([{ id: 'user-1' }, { id: 'user-2' }], 2, 1, 100),
        ),
    } as unknown as jest.Mocked<QueryBus>;

    mockSpaceContext = {
      require: jest.fn().mockReturnValue(SPACE_A),
    } as unknown as jest.Mocked<SpaceContext>;

    adapter = new UserDirectoryAdapter(mockQueryBus, mockSpaceContext);
  });

  it('resolves the active member ids for the current space', async () => {
    const ids = await adapter.listActiveMemberUserIds();
    expect(ids).toEqual(['user-1', 'user-2']);
  });

  it('reuses the cached result for repeated calls within the same space', async () => {
    await adapter.listActiveMemberUserIds();
    await adapter.listActiveMemberUserIds();
    await adapter.listActiveMemberUserIds();

    expect(mockQueryBus.execute).toHaveBeenCalledTimes(1);
  });

  it('fetches separately for a different space', async () => {
    await adapter.listActiveMemberUserIds();

    mockSpaceContext.require.mockReturnValue(SPACE_B);
    await adapter.listActiveMemberUserIds();

    expect(mockQueryBus.execute).toHaveBeenCalledTimes(2);
  });
});
