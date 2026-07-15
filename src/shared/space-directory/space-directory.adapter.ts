import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { SpaceFindAllIdsQuery } from '@contexts/spaces/application/queries/space-find-all-ids/space-find-all-ids.query';
import { ISpaceDirectoryPort } from '@shared/space-directory/space-directory.port';

/**
 * Generic cron-sweep infrastructure, not a per-context business dependency
 * — every "sweep every space" cron (care-schedule due, inventory expiring,
 * ...) needs the same "list every tenant" capability, so it lives once here
 * instead of being copy-pasted into each context's own port/adapter.
 */
@Injectable()
export class SpaceDirectoryAdapter implements ISpaceDirectoryPort {
  private readonly logger = new Logger(SpaceDirectoryAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async listAllSpaceIds(): Promise<string[]> {
    const ids = await this.queryBus.execute<SpaceFindAllIdsQuery, string[]>(
      new SpaceFindAllIdsQuery(),
    );
    this.logger.log(`Resolved ${ids.length} space(s) to sweep`);
    return ids;
  }
}
