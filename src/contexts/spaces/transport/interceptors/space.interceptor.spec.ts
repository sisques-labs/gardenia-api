import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';

import { SpaceContext } from '../../../../shared/space-context/space-context.service';

import { SpaceInterceptor } from './space.interceptor';

function buildMockContext(spaceId?: string): ExecutionContext {
  const req: Record<string, unknown> = {};
  if (spaceId !== undefined) {
    req['spaceId'] = spaceId;
  }

  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function buildMockCallHandler(
  value: unknown = 'result',
): jest.Mocked<CallHandler> {
  return {
    handle: jest.fn().mockReturnValue(of(value)),
  } as unknown as jest.Mocked<CallHandler>;
}

describe('SpaceInterceptor', () => {
  let interceptor: SpaceInterceptor;
  let spaceContext: jest.Mocked<SpaceContext>;

  beforeEach(() => {
    jest.clearAllMocks();

    spaceContext = {
      run: jest
        .fn()
        .mockImplementation((_spaceId: string, fn: () => unknown) => fn()),
      get: jest.fn(),
      require: jest.fn(),
    } as unknown as jest.Mocked<SpaceContext>;

    interceptor = new SpaceInterceptor(spaceContext);
  });

  describe('when req.spaceId is set', () => {
    it('should call spaceContext.run() with the spaceId and wrap next.handle()', (done) => {
      const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
      const ctx = buildMockContext(SPACE_ID);
      const next = buildMockCallHandler('data');

      const result$ = interceptor.intercept(ctx, next) as Observable<unknown>;

      result$.subscribe({
        next: (value) => {
          expect(value).toBe('data');
          expect(spaceContext.run).toHaveBeenCalledWith(
            SPACE_ID,
            expect.any(Function),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate errors from next.handle() through spaceContext.run()', (done) => {
      const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
      const ctx = buildMockContext(SPACE_ID);
      const error = new Error('handler error');
      const next: jest.Mocked<CallHandler> = {
        handle: jest.fn().mockReturnValue(throwError(() => error)),
      } as unknown as jest.Mocked<CallHandler>;

      const result$ = interceptor.intercept(ctx, next) as Observable<unknown>;

      result$.subscribe({
        next: () => done.fail('should not emit'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('when req.spaceId is undefined (@SkipSpace route)', () => {
    it('should pass through without calling spaceContext.run()', (done) => {
      const ctx = buildMockContext(undefined);
      const next = buildMockCallHandler('passthrough');

      const result$ = interceptor.intercept(ctx, next) as Observable<unknown>;

      result$.subscribe({
        next: (value) => {
          expect(value).toBe('passthrough');
          expect(spaceContext.run).not.toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });
  });
});
