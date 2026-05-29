import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

import { SpaceContextMissingException } from '@contexts/spaces/domain/exceptions/space-context-missing.exception';

@Injectable()
export class SpaceContext {
  private readonly als = new AsyncLocalStorage<{ spaceId: string }>();

  run<T>(spaceId: string, fn: () => T): T {
    return this.als.run({ spaceId }, fn);
  }

  get(): string | undefined {
    return this.als.getStore()?.spaceId;
  }

  require(): string {
    const spaceId = this.get();
    if (!spaceId) throw new SpaceContextMissingException();
    return spaceId;
  }
}
