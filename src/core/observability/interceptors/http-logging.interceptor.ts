import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Logger } from 'winston';

import { CorrelationContext } from '@shared/correlation-context/correlation-context.service';

interface IRequestMeta {
  res: Record<string, unknown>;
  method: string;
  path: string;
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly correlationContext: CorrelationContext,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { res, method, path } = this.getRequestMeta(context);
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(method, path, res, start),
        error: (error: unknown) => this.log(method, path, res, start, error),
      }),
    );
  }

  private log(
    method: string,
    path: string,
    res: Record<string, unknown>,
    start: number,
    error?: unknown,
  ): void {
    const durationMs = Date.now() - start;
    const statusCode =
      (res['statusCode'] as number | undefined) ?? (error ? 500 : 200);

    this.logger.info(`${method} ${path} ${statusCode} ${durationMs}ms`, {
      context: 'HTTP',
      correlationId: this.correlationContext.get(),
      method,
      path,
      statusCode,
      durationMs,
    });
  }

  private getRequestMeta(context: ExecutionContext): IRequestMeta {
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const { res } = gqlContext.getContext<{
        res: Record<string, unknown>;
      }>();
      const info = gqlContext.getInfo<{
        operation: { operation: string };
        fieldName: string;
      }>();
      return {
        res,
        method: info.operation.operation.toUpperCase(),
        path: info.fieldName,
      };
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Record<string, unknown>>();
    return {
      res: http.getResponse<Record<string, unknown>>(),
      method: (req['method'] as string | undefined) ?? 'UNKNOWN',
      path:
        (req['originalUrl'] as string | undefined) ??
        (req['url'] as string | undefined) ??
        'unknown',
    };
  }
}
