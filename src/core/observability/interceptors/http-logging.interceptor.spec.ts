import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import type { Logger } from 'winston';

import { CorrelationContext } from '@shared/correlation-context/correlation-context.service';

import { HttpLoggingInterceptor } from './http-logging.interceptor';

function buildHttpContext(
  req: Record<string, unknown>,
  res: Record<string, unknown>,
): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ExecutionContext;
}

function buildGraphqlContext(): ExecutionContext {
  return {
    getType: () => 'graphql',
  } as unknown as ExecutionContext;
}

function buildMockCallHandler(
  value: unknown = 'result',
): jest.Mocked<CallHandler> {
  return {
    handle: jest.fn().mockReturnValue(of(value)),
  } as unknown as jest.Mocked<CallHandler>;
}

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GqlExecutionContext } = jest.requireMock('@nestjs/graphql') as {
  GqlExecutionContext: { create: jest.Mock };
};

describe('HttpLoggingInterceptor', () => {
  let interceptor: HttpLoggingInterceptor;
  let logger: jest.Mocked<Pick<Logger, 'info'>>;
  let correlationContext: jest.Mocked<CorrelationContext>;
  let now: number;

  beforeEach(() => {
    jest.clearAllMocks();

    logger = { info: jest.fn() } as unknown as jest.Mocked<
      Pick<Logger, 'info'>
    >;
    correlationContext = {
      run: jest.fn(),
      get: jest.fn().mockReturnValue('correlation-id'),
    } as unknown as jest.Mocked<CorrelationContext>;

    now = 1_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    interceptor = new HttpLoggingInterceptor(
      logger as unknown as Logger,
      correlationContext,
    );
  });

  describe('HTTP requests', () => {
    it('should log method, path, status and duration on success', (done) => {
      const req = { method: 'GET', originalUrl: '/api/plants' };
      const res = { statusCode: 200 };
      const ctx = buildHttpContext(req, res);
      const next = buildMockCallHandler('data');

      const result$ = interceptor.intercept(ctx, next);
      now = 1_042;

      result$.subscribe({
        next: () => {
          expect(logger.info).toHaveBeenCalledWith('GET /api/plants 200 42ms', {
            context: 'HTTP',
            correlationId: 'correlation-id',
            method: 'GET',
            path: '/api/plants',
            statusCode: 200,
            durationMs: 42,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should default statusCode to 500 on error when res.statusCode is unset', (done) => {
      const req = { method: 'POST', url: '/api/plants' };
      const res = {};
      const ctx = buildHttpContext(req, res);
      const error = new Error('boom');
      const next: jest.Mocked<CallHandler> = {
        handle: jest.fn().mockReturnValue(throwError(() => error)),
      } as unknown as jest.Mocked<CallHandler>;

      const result$ = interceptor.intercept(ctx, next);
      now = 1_010;

      result$.subscribe({
        next: () => done.fail('should not emit'),
        error: (err) => {
          expect(err).toBe(error);
          expect(logger.info).toHaveBeenCalledWith(
            'POST /api/plants 500 10ms',
            expect.objectContaining({ statusCode: 500, durationMs: 10 }),
          );
          done();
        },
      });
    });
  });

  describe('GraphQL requests', () => {
    it('should log the operation type and field name', (done) => {
      const res = { statusCode: 200 };
      const ctx = buildGraphqlContext();
      const next = buildMockCallHandler('data');

      GqlExecutionContext.create.mockReturnValue({
        getContext: () => ({ res }),
        getInfo: () => ({
          operation: { operation: 'query' },
          fieldName: 'plantsFindByCriteria',
        }),
      });

      const result$ = interceptor.intercept(ctx, next);
      now = 1_005;

      result$.subscribe({
        next: () => {
          expect(logger.info).toHaveBeenCalledWith(
            'QUERY plantsFindByCriteria 200 5ms',
            expect.objectContaining({
              method: 'QUERY',
              path: 'plantsFindByCriteria',
            }),
          );
          done();
        },
        error: done.fail,
      });
    });
  });
});
