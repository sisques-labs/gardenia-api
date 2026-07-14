import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { ISpaceDirectoryPort } from '@contexts/inventory/application/ports/space-directory.port';
import { SpaceFindAllIdsQuery } from '@contexts/spaces/application/queries/space-find-all-ids/space-find-all-ids.query';

@Injectable()
export class SpaceDirectoryAdapter implements ISpaceDirectoryPort {
  private readonly logger = new Logger(SpaceDirectoryAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async listAllSpaceIds(): Promise<string[]> {
    const ids = await this.queryBus.execute<SpaceFindAllIdsQuery, string[]>(
      new SpaceFindAllIdsQuery(),
    );
    this.logger.log(
      `Resolved ${ids.length} space(s) to sweep for expiring items`,
    );
    return ids;
  }
}
