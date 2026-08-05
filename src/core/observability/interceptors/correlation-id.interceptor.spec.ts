import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';

import { CorrelationContext } from '@shared/correlation-context/correlation-context.service';

import {
  CORRELATION_ID_HEADER,
  CorrelationIdInterceptor,
} from './correlation-id.interceptor';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'generated-uuid'),
}));

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GqlExecutionContext } = jest.requireMock('@nestjs/graphql') as {
  GqlExecutionContext: { create: jest.Mock };
};

function buildMockContext(
  headers: Record<string, string | undefined>,
  setHeader: jest.Mock,
  type: 'http' | 'graphql' = 'http',
): ExecutionContext {
  const req = { headers };
  const res = { setHeader };

  if (type === 'graphql') {
    GqlExecutionContext.create.mockReturnValue({
      getContext: () => ({ req, res }),
    });
    return {
      getType: () => 'graphql',
    } as unknown as ExecutionContext;
  }

  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ExecutionContext;
}

function buildMockCallHandler(
  value: unknown = 'result',
): jest.Mocked<CallHandler> {
  return {
    handle: jest.fn().mockReturnValue(of(value)),
  } as unknown as jest.Mocked<CallHandler>;
}

describe('CorrelationIdInterceptor', () => {
  let interceptor: CorrelationIdInterceptor;
  let correlationContext: jest.Mocked<CorrelationContext>;
  let setHeader: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    correlationContext = {
      run: jest
        .fn()
        .mockImplementation((_id: string, fn: () => unknown) => fn()),
      get: jest.fn(),
    } as unknown as jest.Mocked<CorrelationContext>;

    setHeader = jest.fn();

    interceptor = new CorrelationIdInterceptor(correlationContext);
  });

  describe('when the request carries an x-request-id header', () => {
    it('should reuse it and echo it on the response', (done) => {
      const ctx = buildMockContext(
        { [CORRELATION_ID_HEADER]: 'incoming-id' },
        setHeader,
      );
      const next = buildMockCallHandler('data');

      const result$ = interceptor.intercept(ctx, next);

      result$.subscribe({
        next: (value) => {
          expect(value).toBe('data');
          expect(setHeader).toHaveBeenCalledWith(
            CORRELATION_ID_HEADER,
            'incoming-id',
          );
          expect(correlationContext.run).toHaveBeenCalledWith(
            'incoming-id',
            expect.any(Function),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('when the request has no x-request-id header', () => {
    it('should generate one and use it consistently', (done) => {
      const ctx = buildMockContext({}, setHeader);
      const next = buildMockCallHandler('data');

      const result$ = interceptor.intercept(ctx, next);

      result$.subscribe({
        next: () => {
          expect(setHeader).toHaveBeenCalledWith(
            CORRELATION_ID_HEADER,
            'generated-uuid',
          );
          expect(correlationContext.run).toHaveBeenCalledWith(
            'generated-uuid',
            expect.any(Function),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('when the request is a GraphQL operation', () => {
    it('should read/write headers through GqlExecutionContext, same as HTTP', (done) => {
      const ctx = buildMockContext(
        { [CORRELATION_ID_HEADER]: 'incoming-id' },
        setHeader,
        'graphql',
      );
      const next = buildMockCallHandler('data');

      const result$ = interceptor.intercept(ctx, next);

      result$.subscribe({
        next: (value) => {
          expect(value).toBe('data');
          expect(setHeader).toHaveBeenCalledWith(
            CORRELATION_ID_HEADER,
            'incoming-id',
          );
          expect(correlationContext.run).toHaveBeenCalledWith(
            'incoming-id',
            expect.any(Function),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  it('should propagate errors from next.handle() through correlationContext.run()', (done) => {
    const ctx = buildMockContext({}, setHeader);
    const error = new Error('handler error');
    const next: jest.Mocked<CallHandler> = {
      handle: jest.fn().mockReturnValue(throwError(() => error)),
    } as unknown as jest.Mocked<CallHandler>;

    const result$ = interceptor.intercept(ctx, next);

    result$.subscribe({
      next: () => done.fail('should not emit'),
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });
});
