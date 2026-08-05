import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class CorrelationContext {
  private readonly als = new AsyncLocalStorage<{ correlationId: string }>();

  run<T>(correlationId: string, fn: () => T): T {
    return this.als.run({ correlationId }, fn);
  }

  get(): string | undefined {
    return this.als.getStore()?.correlationId;
  }
}
