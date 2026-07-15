import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { IUserDirectoryPort } from '@contexts/notifications/application/ports/user-directory.port';
import { UserFindByCriteriaQuery } from '@contexts/users/application/queries/user-find-by-criteria/user-find-by-criteria.query';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { fetchAllPages } from '@shared/pagination/fetch-all-pages.util';
import { SpaceContext } from '@shared/space-context/space-context.service';

interface CacheEntry {
  userIds: string[];
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000;

/**
 * Caches the resolved member list per space for a short TTL. A single cron
 * sweep tick can dispatch dozens of UpsertConditionNotificationCommands for
 * the same space in quick succession, each of which would otherwise re-run
 * this same paginated query. 30s comfortably covers one sweep's dispatch
 * burst (sweeps run at most every 15 minutes) while staying well within
 * "a newly added member might miss one notification" territory, not stale
 * enough to matter.
 */
@Injectable()
export class UserDirectoryAdapter implements IUserDirectoryPort {
  private readonly logger = new Logger(UserDirectoryAdapter.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly queryBus: QueryBus,
    private readonly spaceContext: SpaceContext,
  ) {}

  async listActiveMemberUserIds(): Promise<string[]> {
    const spaceId = this.spaceContext.require();
    const cached = this.cache.get(spaceId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.userIds;
    }

    const users = await fetchAllPages((page, perPage) =>
      this.queryBus.execute<
        UserFindByCriteriaQuery,
        PaginatedResult<UserViewModel>
      >(
        new UserFindByCriteriaQuery({
          criteria: new Criteria([], [], { page, perPage }),
        }),
      ),
    );
    const userIds = users.map((user) => user.id);
    this.cache.set(spaceId, { userIds, expiresAt: Date.now() + CACHE_TTL_MS });

    this.logger.log(
      `Resolved ${userIds.length} active member(s) for space ${spaceId}`,
    );
    return userIds;
  }
}
