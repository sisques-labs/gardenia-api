import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { IUserDirectoryPort } from '@contexts/notifications/application/ports/user-directory.port';
import { UserFindByCriteriaQuery } from '@contexts/users/application/queries/user-find-by-criteria/user-find-by-criteria.query';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';

const PAGE_SIZE = 100;

@Injectable()
export class UserDirectoryAdapter implements IUserDirectoryPort {
  private readonly logger = new Logger(UserDirectoryAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async listActiveMemberUserIds(): Promise<string[]> {
    const userIds: string[] = [];
    let page = 1;

    for (;;) {
      const criteria = new Criteria([], [], { page, perPage: PAGE_SIZE });
      const result: PaginatedResult<UserViewModel> =
        await this.queryBus.execute(new UserFindByCriteriaQuery({ criteria }));
      userIds.push(...result.items.map((user) => user.id));
      if (result.items.length < PAGE_SIZE) break;
      page += 1;
    }

    this.logger.log(
      `Resolved ${userIds.length} active member(s) for the current space`,
    );
    return userIds;
  }
}
